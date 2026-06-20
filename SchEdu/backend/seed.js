const sequelize = require('./config/db');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function seed() {
  try {
    await sequelize.sync({ force: true }); // Warning: wipes existing data!

    // Replace with real hashed passwords
  const hashedPassword = await bcrypt.hash('pass123', 10);

    await User.bulkCreate([
      { first_name: 'Admin', email: 'admin@example.com', password: hashedPassword, role: 'admin' },
      { first_name: 'Teacher', email: 'teacher@example.com', password: hashedPassword, role: 'teacher' },
      { first_name: 'Student', email: 'student@example.com', password: hashedPassword, role: 'student' },
    ]);

    console.log('Seed completed');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    process.exit();
  }
}

seed();
