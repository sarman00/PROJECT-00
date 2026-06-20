const { Timetable, Leave, User } = require('../models');
const { Op } = require('sequelize');

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

function getWeekdayNamesBetween(startDateStr, endDateStr) {
  const set = new Set();
  try {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      if (day >= 1 && day <= 5) set.add(DAYS[day - 1]);
    }
  } catch (_) {}
  return Array.from(set);
}

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
      for (const s of schedule[day] || []) {
        if (s.teacher_id) ensure(s.teacher_id, day).add(s.period);
      }
    }
  }
  return index;
}

function chooseSubstitute(teacherPool, day, period, assignmentIndex, teacherOnLeaveSet) {
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

/**
 * Reassign sessions for a teacher's approved leave.
 * Strategy:
 * - Identify weekdays in the leave range (Mon-Fri).
 * - For each timetable and those weekdays, replace sessions taught by the leaving teacher.
 * - Choose substitutes from same department if possible, avoiding conflicts and teachers also on leave.
 */
async function reassignLeave(leaveId) {
  const leave = await Leave.findByPk(leaveId);
  if (!leave) throw new Error('Leave not found');

  const startTime = Date.now();

  const weekdays = getWeekdayNamesBetween(leave.start_date, leave.end_date);
  if (weekdays.length === 0) {
    leave.status = 'processed';
    leave.csp_processing_time = 0;
    await leave.save();
    return leave;
  }

  const [teacher, allTeachers, timetables] = await Promise.all([
    User.findByPk(leave.teacher_id),
    User.findAll({ where: { role: 'teacher', is_active: true } }),
    Timetable.findAll({ where: { is_active: true } }),
  ]);

  if (!teacher) throw new Error('Leaving teacher not found');

  // other leaves overlapping the same window
  const overlapping = await Leave.findAll({
    where: {
      id: { [Op.ne]: leave.id },
      status: { [Op.in]: ['approved', 'processed'] },
      [Op.or]: [
        { start_date: { [Op.between]: [leave.start_date, leave.end_date] } },
        { end_date: { [Op.between]: [leave.start_date, leave.end_date] } },
        { start_date: { [Op.lte]: leave.start_date }, end_date: { [Op.gte]: leave.end_date } },
      ],
    },
  });
  const teacherOnLeaveSet = new Set(overlapping.map(l => l.teacher_id));

  const assignmentIndex = buildTeacherAssignmentIndex(timetables);

  // pool: prefer same department
  const sameDeptPool = allTeachers.filter(t => t.id !== teacher.id && t.department === teacher.department);
  const fallbackPool = allTeachers.filter(t => t.id !== teacher.id);

  let changes = 0;

  for (const tt of timetables) {
    const schedule = tt.schedule || {};
    for (const day of weekdays) {
      const sessions = schedule[day] || [];
      for (const sess of sessions) {
        if (sess.teacher_id === leave.teacher_id) {
          let chosen = chooseSubstitute(sameDeptPool, day, sess.period, assignmentIndex, teacherOnLeaveSet)
            || chooseSubstitute(fallbackPool, day, sess.period, assignmentIndex, teacherOnLeaveSet);
          if (chosen) {
            // update assignment index
            if (!assignmentIndex.has(chosen.id)) assignmentIndex.set(chosen.id, new Map());
            const map = assignmentIndex.get(chosen.id);
            if (!map.has(day)) map.set(day, new Set());
            map.get(day).add(sess.period);

            // free up original teacher slot (not strictly necessary)
            const origMap = assignmentIndex.get(leave.teacher_id);
            if (origMap && origMap.get(day)) origMap.get(day).delete(sess.period);

            sess.teacher_id = chosen.id;
            changes++;
          }
        }
      }
    }
    // Save if any changes touched this timetable
    await tt.update({ schedule });
  }

  leave.status = 'processed';
  leave.csp_processing_time = Date.now() - startTime;
  await leave.save();

  return { leave, changes };
}

module.exports = { reassignLeave };
