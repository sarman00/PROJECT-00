const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { faker } = require('@faker-js/faker');
const { sequelize, User, Subject, Class } = require('../models');

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  try {
    console.log('Seeding bulk data into', sequelize.getDialect(), 'DB...');
    await sequelize.sync({ alter: true });

    const departments = [
      'Computer Science',
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'English',
      'Economics',
      'Electronics',
      'Mechanical',
      'Civil',
    ];
    const sections = ['A', 'B', 'C', 'D', 'E'];

    // --- Subjects (e.g., 150) ---
    const subjectCount = 150;
    const subjects = [];
    for (let i = 0; i < subjectCount; i++) {
      const dept = randomFrom(departments);
      const sem = faker.number.int({ min: 1, max: 8 });
      const code = `SUB${100 + i}`;
      subjects.push({
        name: `${dept} ${faker.word.words({ count: { min: 1, max: 2 } })}`,
        code,
        department: dept,
        semester: sem,
        credits: faker.number.int({ min: 2, max: 5 }),
        is_active: true,
      });
    }

    // --- Classes (e.g., 60) ---
    const classCount = 60;
    const classes = [];
    for (let i = 0; i < classCount; i++) {
      const dept = randomFrom(departments);
      const sem = faker.number.int({ min: 1, max: 8 });
      const section = randomFrom(sections);
      classes.push({
        name: `${dept} ${sem}${section}`,
        section,
        department: dept,
        semester: sem,
        academic_year: '2025-2026',
        capacity: faker.number.int({ min: 25, max: 60 }),
        room: `${dept.split(' ')[0][0]}${faker.number.int({ min: 100, max: 599 })}`,
        is_active: true,
      });
    }

    // --- Teachers (e.g., 120) ---
    const teacherCount = 120;
    const teachers = [];
    for (let i = 0; i < teacherCount; i++) {
      const first = faker.person.firstName();
      const last = faker.person.lastName();
      const dept = randomFrom(departments);
      teachers.push({
        first_name: first,
        last_name: last,
        email: faker.internet.email({ firstName: first, lastName: last, provider: 'example.com' }).toLowerCase(),
        password: 'pass123', // model hook will hash
        role: 'teacher',
        department: dept,
        is_active: true,
      });
    }

    // --- Students (e.g., 300) ---
    const studentCount = 300;
    const students = [];
    for (let i = 0; i < studentCount; i++) {
      const first = faker.person.firstName();
      const last = faker.person.lastName();
      const dept = randomFrom(departments);
      students.push({
        first_name: first,
        last_name: last,
        email: faker.internet.email({ firstName: first, lastName: last, provider: 'student.edu' }).toLowerCase(),
        password: 'pass123',
        role: 'student',
        department: dept,
        is_active: true,
      });
    }

    // Insert in sequence to honor unique constraints
    const createdSubjects = await Subject.bulkCreate(subjects, { ignoreDuplicates: true, validate: true });
    const createdClasses = await Class.bulkCreate(classes, { ignoreDuplicates: true, validate: true });
    const createdTeachers = await User.bulkCreate(teachers, { ignoreDuplicates: true, validate: true });
    const createdStudents = await User.bulkCreate(students, { ignoreDuplicates: true, validate: true });

    console.log('Seeded:', {
      subjects: createdSubjects.length,
      classes: createdClasses.length,
      teachers: createdTeachers.length,
      students: createdStudents.length,
    });

    console.log('Done. Default password for seeded users is "password123"');
  } catch (err) {
    console.error('Bulk seed error:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close().catch(() => {});
  }
}

main();

