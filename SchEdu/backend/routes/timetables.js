const express = require('express');
const { body } = require('express-validator');
const { Timetable, Class, Subject, User } = require('../models');
const { generateDemoTimetables, ensureTeacherAssignments } = require('../services/timetableScheduler');
const validateRequest = require('../middleware/validationMiddleware');
const router = express.Router();

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

/**
 * @swagger
 * /api/timetables/generate-all:
 *   post:
 *     tags: [Timetables]
 *     summary: Generate demo timetables for all active classes
 *     responses:
 *       201: { description: Generated }
 */
router.post('/generate-all', async (req, res) => {
  try {
    // Ensure there is at least some data to generate from
    const [classCount, subjectCount, teacherCount] = await Promise.all([
      Class.count({ where: { is_active: true } }),
      Subject.count({ where: { is_active: true } }),
      User.count({ where: { role: 'teacher', is_active: true } }),
    ]);

    let seeded = false;
    if (classCount === 0 || subjectCount === 0 || teacherCount === 0) {
      // Minimal demo dataset
      const [c] = await Promise.all([
        Class.create({
          name: 'CS 1A', section: 'A', department: 'Computer Science', semester: 1,
          academic_year: '2025-2026', capacity: 40, room: 'CS101', is_active: true,
        }),
      ]);

      const subjDefs = [
        { code: 'CS-MATH101', name: 'Discrete Mathematics' },
        { code: 'CS-PHYS101', name: 'Digital Electronics' },
        { code: 'CS-PROG101', name: 'Programming Fundamentals' },
        { code: 'CS-CHEM101', name: 'Engineering Chemistry' },
        { code: 'CS-ENG101',  name: 'Professional English' },
        { code: 'CS-PE101',   name: 'Physical Education' },
      ];
      for (const s of subjDefs) {
        await Subject.findOrCreate({
          where: { code: s.code },
          defaults: { ...s, department: 'Computer Science', semester: 1, credits: 3, is_active: true },
        });
      }
      const teacherDefs = [
        { email: 'alice.teacher@example.com', first_name: 'Alice', last_name: 'Teacher' },
        { email: 'bob.teacher@example.com',   first_name: 'Bob',   last_name: 'Teacher' },
        { email: 'carol.teacher@example.com', first_name: 'Carol', last_name: 'Teacher' },
      ];
      for (const t of teacherDefs) {
        await User.findOrCreate({
          where: { email: t.email },
          defaults: { ...t, password: 'pass123', role: 'teacher', department: 'Computer Science', is_active: true },
        });
      }
      
      // Create demo students assigned to the class
      const studentDefs = [
        { email: 'john.student@example.com', first_name: 'John', last_name: 'Student' },
        { email: 'jane.student@example.com', first_name: 'Jane', last_name: 'Student' },
        { email: 'mike.student@example.com', first_name: 'Mike', last_name: 'Student' },
      ];
      for (const s of studentDefs) {
        await User.findOrCreate({
          where: { email: s.email },
          defaults: { ...s, password: 'pass123', role: 'student', department: 'Computer Science', class_id: c.id, is_active: true },
        });
      }
      seeded = true;
    }

    const result = await generateDemoTimetables();
    res.status(201).json({ message: 'Generated timetables', seeded, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/timetables/ensure-teacher/{teacherId}:
 *   post:
 *     tags: [Timetables]
 *     summary: Ensure a teacher has at least a few assignments by reassigning sessions
 */
router.post('/ensure-teacher/:teacherId', async (req, res) => {
  try {
    const result = await ensureTeacherAssignments(req.params.teacherId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const timetable = await Timetable.create(req.body);
    res.status(201).json(timetable);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const timetables = await Timetable.findAll({
      // Note: plain attributes to avoid requiring association, return class_id only
      where: { is_active: true }
    });
    res.json(timetables);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/timetables/class/{classId}:
 *   get:
 *     tags: [Timetables]
 *     summary: Get timetable for a class
 *     parameters:
 *       - in: path
 *         name: classId
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
router.get('/class/:classId', async (req, res) => {
  try {
    const timetable = await Timetable.findOne({
      where: { class_id: req.params.classId, is_active: true }
    });
    if (!timetable) return res.status(404).json({ error: 'Timetable not found' });
    res.json(timetable);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/timetables/year/{year}/semester/{semester}:
 *   get:
 *     tags: [Timetables]
 *     summary: List timetables for year and semester
 *     parameters:
 *       - in: path
 *         name: year
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: semester
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200: { description: OK }
 */
router.get('/year/:year/semester/:semester', async (req, res) => {
  try {
    const timetables = await Timetable.findAll({
      where: {
        academic_year: req.params.year,
        semester: req.params.semester,
        is_active: true
      }
    });
    res.json(timetables);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/schedule', async (req, res) => {
  try {
    const timetable = await Timetable.findByPk(req.params.id);
    if (!timetable) return res.status(404).json({ error: 'Timetable not found' });

    timetable.schedule = req.body.schedule;
    timetable.version += 1;
    timetable.last_optimized = new Date();
    await timetable.save();

    res.json(timetable);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/timetables/{id}:
 *   get:
 *     tags: [Timetables]
 *     summary: Get timetable by id
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
router.get('/:id', async (req, res) => {
  try {
    const timetable = await Timetable.findByPk(req.params.id);
    if (!timetable) return res.status(404).json({ error: 'Timetable not found' });
    res.json(timetable);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const [updatedCount] = await Timetable.update(req.body, { where: { id: req.params.id } });
    if (updatedCount === 0) return res.status(404).json({ error: 'Timetable not found' });
    const updated = await Timetable.findByPk(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/timetables/teacher/{teacherId}:
 *   get:
 *     tags: [Timetables]
 *     summary: Get aggregated timetable for a teacher across all classes
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200: { description: OK }
 */
router.get('/debug/summary', async (req, res) => {
  try {
    const [classCount, subjectCount, teacherCount, timetableCount] = await Promise.all([
      Class.count({ where: { is_active: true } }),
      Subject.count({ where: { is_active: true } }),
      User.count({ where: { role: 'teacher', is_active: true } }),
      Timetable.count({ where: { is_active: true } }),
    ]);
    const classIds = await Timetable.findAll({ where: { is_active: true }, attributes: ['class_id'] });
    res.json({
      summary: { classCount, subjectCount, teacherCount, timetableCount },
      classIdsWithTimetables: [...new Set(classIds.map(c => c.class_id))],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/timetables/student/{studentId}:
 *   get:
 *     tags: [Timetables]
 *     summary: Get timetable for a student based on their enrolled class
 *     parameters:
 *       - in: path
 *         name: studentId
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200: { description: OK }
 *       404: { description: Student not found or not enrolled in a class }
 */
router.get('/student/:studentId', async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    
    // Find the student and their class
    const student = await User.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // If student has no class assigned, try to find an active class and assign them
    let classId = student.class_id;
    if (!classId) {
      // Auto-assign to the first available class
      const activeClass = await Class.findOne({ where: { is_active: true } });
      if (activeClass) {
        classId = activeClass.id;
        student.class_id = classId;
        await student.save();
      } else {
        return res.status(404).json({ error: 'No classes available. Please contact administrator.' });
      }
    }
    
    // Now fetch the timetable for this class
    const timetable = await Timetable.findOne({
      where: { class_id: classId, is_active: true }
    });
    
    if (!timetable) {
      return res.status(404).json({ error: 'No timetable found for your class' });
    }
    
    // Get class info
    const classInfo = await Class.findByPk(classId);
    
    res.json({
      student_id: studentId,
      class_id: classId,
      class_name: classInfo ? `${classInfo.name}${classInfo.section ? ' - ' + classInfo.section : ''}` : `Class ${classId}`,
      ...timetable.toJSON()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const teacherId = parseInt(req.params.teacherId, 10);
    const [timetables, classes, subjects] = await Promise.all([
      Timetable.findAll({ where: { is_active: true } }),
      Class.findAll({ attributes: ['id', 'name', 'section', 'department'] }),
      Subject.findAll({ attributes: ['id', 'name'] }),
    ]);

    const classMap = new Map(classes.map(c => [c.id, c]));
    const subjMap = new Map(subjects.map(s => [s.id, s.name]));

    const result = {};
    for (const day of DAYS) result[day] = [];

    for (const tt of timetables) {
      const schedule = tt.schedule || {};
      for (const day of DAYS) {
        for (const sess of (schedule[day] || [])) {
          if (sess.teacher_id === teacherId) {
            const c = classMap.get(tt.class_id);
            result[day].push({
              period: sess.period,
              subject_id: sess.subject_id,
              subject_name: subjMap.get(sess.subject_id) || `SUB-${sess.subject_id}`,
              class_id: tt.class_id,
              class_name: c ? `${c.name}${c.section ? ' - ' + c.section : ''}` : `Class ${tt.class_id}`,
              room: sess.room || null,
            });
          }
        }
      }
    }

    // Sort sessions by period for each day
    for (const day of DAYS) result[day].sort((a, b) => a.period - b.period);

    res.json({ teacher_id: teacherId, schedule: result, days: DAYS, periods_per_day: 6 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
