const { sequelize, User, Class, Subject, Timetable, Leave } = require('../models');
const { Op } = require('sequelize');

// Days ordering and helpers
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const PERIODS_PER_DAY_DEFAULT = 6;

function getWeekdayNamesBetween(startDateStr, endDateStr) {
  const set = new Set();
  try {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay(); // 0=Sun ... 6=Sat
      if (day >= 1 && day <= 5) {
        set.add(DAYS[day - 1]);
      }
    }
  } catch (_) {}
  return Array.from(set);
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Build a map of teacher assignments so we can avoid conflicts
function buildTeacherAssignmentIndex(timetables) {
  const index = new Map(); // teacherId -> day -> Set(period)
  const ensure = (tId, day) => {
    if (!index.has(tId)) index.set(tId, new Map());
    const dayMap = index.get(tId);
    if (!dayMap.has(day)) dayMap.set(day, new Set());
    return dayMap.get(day);
  };

  for (const tt of timetables) {
    const schedule = tt.schedule || {};
    for (const day of Object.keys(schedule)) {
      for (const session of schedule[day] || []) {
        if (session.teacher_id) {
          ensure(session.teacher_id, day).add(session.period);
        }
      }
    }
  }
  return index;
}

// Choose a substitute teacher matching constraints (same department, free at that slot, not on leave), with lowest current load
async function chooseSubstitute(teacherPool, day, period, assignmentIndex, teacherOnLeaveSet) {
  let best = null;
  let bestLoad = Infinity;
  for (const t of teacherPool) {
    if (teacherOnLeaveSet.has(t.id)) continue;
    const dayMap = assignmentIndex.get(t.id);
    if (dayMap && dayMap.get(day) && dayMap.get(day).has(period)) continue; // conflict
    const load = dayMap ? Array.from(dayMap.values()).reduce((a, s) => a + s.size, 0) : 0;
    if (load < bestLoad) {
      best = t;
      bestLoad = load;
    }
  }
  return best;
}

// Generate timetables with simple round-robin teacher allocation and conflict avoidance
async function generateDemoTimetables() {
  const classes = await Class.findAll({ where: { is_active: true } });
  const allSubjects = await Subject.findAll({ where: { is_active: true } });
  const teachers = await User.findAll({ where: { role: 'teacher', is_active: true } });

  // Index teachers by department
  const teachersByDept = new Map();
  for (const t of teachers) {
    const key = t.department || '__nodept__';
    if (!teachersByDept.has(key)) teachersByDept.set(key, []);
    teachersByDept.get(key).push(t);
  }

  // Round-robin index per department
  const rr = new Map();
  const nextInPool = (deptKey, pool) => {
    const idx = rr.get(deptKey) || 0;
    rr.set(deptKey, (idx + 1) % pool.length);
    return pool[idx % pool.length];
  };

  const timetables = [];
  const assignmentIndex = new Map(); // teacherId -> day -> Set(period)

  for (const c of classes) {
    const days = DAYS;
    const periodsPerDay = PERIODS_PER_DAY_DEFAULT;

    // choose a basket of subjects for this class from its department+semester
    let subs = allSubjects.filter(s => (c.department ? s.department === c.department : true) && (c.semester ? s.semester === c.semester : true));
    if (subs.length < 6) {
      // fallback: same department then any
      const sameDept = allSubjects.filter(s => (c.department ? s.department === c.department : true));
      subs = subs.concat(sameDept.slice(0, 6 - subs.length));
      if (subs.length < 6) subs = subs.concat(allSubjects.slice(0, 6 - subs.length));
    }

    const schedule = {};
    const deptKey = c.department || '__nodept__';
    const pool = (teachersByDept.get(deptKey) && teachersByDept.get(deptKey).length > 0) ? teachersByDept.get(deptKey) : teachers;

    for (const [dayIdx, day] of days.entries()) {
      schedule[day] = [];
      for (let period = 1; period <= periodsPerDay; period++) {
        const subject = subs[(dayIdx * periodsPerDay + (period - 1)) % subs.length];

        // build current assignment index lazily from previously created timetables
        if (!assignmentIndex.size && timetables.length) {
          for (const tt of timetables) {
            const idx = buildTeacherAssignmentIndex([tt]);
            for (const [tId, dayMap] of idx.entries()) {
              if (!assignmentIndex.has(tId)) assignmentIndex.set(tId, new Map());
              const dest = assignmentIndex.get(tId);
              for (const [d, set] of dayMap.entries()) {
                if (!dest.has(d)) dest.set(d, new Set());
                for (const p of set) dest.get(d).add(p);
              }
            }
          }
        }

        // pick a teacher without conflicts via round-robin
        let chosen = null;
        if (pool.length > 0) {
          const startIdx = rr.get(deptKey) || 0;
          for (let tries = 0; tries < pool.length; tries++) {
            const candidate = pool[(startIdx + tries) % pool.length];
            const map = assignmentIndex.get(candidate.id) || new Map();
            const set = map.get(day) || new Set();
            if (!set.has(period)) { chosen = candidate; break; }
          }
          if (!chosen) chosen = nextInPool(deptKey, pool);
        } else {
          // Extremely unlikely: no teachers at all
          throw new Error('No teachers available to generate timetable');
        }

        // record in assignment index
        if (!assignmentIndex.has(chosen.id)) assignmentIndex.set(chosen.id, new Map());
        const dmap = assignmentIndex.get(chosen.id);
        if (!dmap.has(day)) dmap.set(day, new Set());
        dmap.get(day).add(period);

        schedule[day].push({ period, subject_id: subject.id, teacher_id: chosen.id, room: c.room || `R${100 + period}` });
      }
    }

    const tt = await Timetable.create({
      class_id: c.id,
      academic_year: c.academic_year || '2025-2026',
      semester: c.semester || 1,
      schedule,
      version: 1,
      is_active: true,
    });
    timetables.push(tt);
  }
  return { created: timetables.length };
}

// Ensure a teacher has at least some assignments across existing timetables by reassigning a few sessions
async function ensureTeacherAssignments(teacherId) {
  const tId = parseInt(teacherId, 10);
  const timetables = await Timetable.findAll({ where: { is_active: true } });
  if (timetables.length === 0) return { changed: 0, message: 'No timetables exist' };

  // Build current index and detect if teacher already has sessions
  const index = buildTeacherAssignmentIndex(timetables);
  if (index.has(tId)) {
    let hasAny = false;
    for (const set of index.get(tId).values()) { if (set.size > 0) { hasAny = true; break; } }
    if (hasAny) return { changed: 0, message: 'Teacher already has assignments' };
  }

  let changed = 0;
  for (const tt of timetables) {
    const schedule = tt.schedule || {};
    for (const day of DAYS) {
      const sessions = schedule[day] || [];
      if (sessions.length === 0) continue;
      // pick first session slot not conflicting for this teacher
      for (const sess of sessions) {
        const dayMap = index.get(tId) || new Map();
        const set = dayMap.get(day) || new Set();
        if (!set.has(sess.period)) {
          const prev = sess.teacher_id;
          sess.teacher_id = tId;

          // Clear session for original teacher
          if (prev) {
            const prevDayMap = index.get(prev) || new Map();
            const prevSet = prevDayMap.get(day) || new Set();
            prevSet.delete(sess.period);
          }
          // update index for teacher
          if (!index.has(tId)) index.set(tId, new Map());
          const dmap = index.get(tId);
          if (!dmap.has(day)) dmap.set(day, new Set());
          dmap.get(day).add(sess.period);
          changed += 1;
          break; // move to next day/class
        }
      }
      if (changed >= 5) break; // assign a handful
    }
    if (changed >= 5) {
      tt.schedule = schedule;
      await tt.save();
      break;
    } else {
      tt.schedule = schedule;
      await tt.save();
    }
  }
  return { changed };
}

module.exports = { generateDemoTimetables, ensureTeacherAssignments };
