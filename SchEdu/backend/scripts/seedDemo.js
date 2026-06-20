const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { sequelize, User, Subject, Class } = require('../models');
const { generateDemoTimetables } = require('../services/timetableScheduler');

async function upsert(Model, where, values) {
  const existing = await Model.findOne({ where });
  if (existing) {
    await existing.update(values);
    return existing;
  }
  return Model.create({ ...where, ...values });
}

async function main() {
  try {
    console.log('Seeding predictable demo data...');
    await sequelize.sync();

    // Subjects
    const subs = [
      { code: 'CS-MATH101', name: 'Discrete Mathematics', department: 'Computer Science', semester: 1, credits: 4 },
      { code: 'CS-PHYS101', name: 'Digital Electronics', department: 'Computer Science', semester: 1, credits: 3 },
      { code: 'CS-PROG101', name: 'Programming Fundamentals', department: 'Computer Science', semester: 1, credits: 4 },
      { code: 'CS-CHEM101', name: 'Engineering Chemistry', department: 'Computer Science', semester: 1, credits: 3 },
      { code: 'CS-ENG101',  name: 'Professional English', department: 'Computer Science', semester: 1, credits: 2 },
      { code: 'CS-PE101',   name: 'Physical Education', department: 'Computer Science', semester: 1, credits: 1 },
    ];

    for (const s of subs) {
      await upsert(Subject, { code: s.code }, s);
    }

    // Class
    const cls = await upsert(Class, { name: 'CS 1A', section: 'A' }, {
      department: 'Computer Science',
      semester: 1,
      academic_year: '2025-2026',
      capacity: 40,
      room: 'CS101',
      is_active: true,
    });

    // Teachers
    const teachers = [
      { email: 'alice.teacher@example.com', first_name: 'Alice', last_name: 'Teacher' },
      { email: 'bob.teacher@example.com',   first_name: 'Bob',   last_name: 'Teacher' },
      { email: 'carol.teacher@example.com', first_name: 'Carol', last_name: 'Teacher' },
    ];
    for (const t of teachers) {
      await upsert(User, { email: t.email }, {
        ...t,
        password: 'pass123', // hashed by model hooks
        role: 'teacher',
        department: 'Computer Science',
        is_active: true,
      });
    }

    // Student (optional)
    await upsert(User, { email: 'sam.student@student.edu' }, {
      first_name: 'Sam', last_name: 'Student', password: 'pass123', role: 'student', department: 'Computer Science', is_active: true,
    });

    // Admin (optional)
    await upsert(User, { email: 'admin@example.com' }, {
      first_name: 'Demo', last_name: 'Admin', password: 'pass123', role: 'admin', department: 'Computer Science', is_active: true,
    });

    // Generate timetables
    const result = await generateDemoTimetables();
    console.log('Demo data seeded. Timetables:', result);

    console.log('Login hints:');
    console.log('  Admin:    admin@example.com / pass123');
    console.log('  Teacher:  alice.teacher@example.com / pass123');
    console.log('  Student:  sam.student@student.edu / pass123');
  } catch (err) {
    console.error('Demo seed error:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close().catch(() => {});
  }
}

main();

