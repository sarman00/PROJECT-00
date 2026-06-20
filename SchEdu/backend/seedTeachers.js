const sequelize = require('./config/db');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function seedTeachers() {
  try {
    await sequelize.sync({ alter: true });

    const hashedPassword = await bcrypt.hash('pass123', 10);

    await User.bulkCreate([
      {
        id: 1,
        first_name: 'Alice',
        last_name: 'Smith',
        email: 'alice@example.com',
        password: hashedPassword,
        role: 'teacher',
        is_active: true,
      },
      {
        id: 2,
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob@example.com',
        password: hashedPassword,
        role: 'teacher',
        is_active: true,
      },
      {
        id: 3,
        first_name: 'Carol',
        last_name: 'Williams',
        email: 'carol@example.com',
        password: hashedPassword,
        role: 'teacher',
        is_active: true,
      },
    ]);

    console.log('Sample teachers seeded successfully');
  } catch (error) {
    console.error('Error seeding teachers:', error);
  } finally {
    process.exit();
  }
}

seedTeachers();
