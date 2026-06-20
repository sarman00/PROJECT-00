const { User, sequelize } = require('./models');

async function seedAdmin() {
  try {
    // Ensure DB is ready
    await sequelize.sync();

    const email = 'admin@example.com';
    const password = 'pass123'; // raw password; model hooks will hash it

    let user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({
        email,
        password,
        role: 'admin',
        first_name: 'Super',
        last_name: 'Admin',
      });
      console.log('Admin user created');
    } else {
      user.first_name = 'Super';
      user.last_name = 'Admin';
      user.role = 'admin';
      user.password = password; // will hash via beforeUpdate hook
      await user.save();
      console.log('Admin user updated (password reset)');
    }
  } catch (error) {
    console.error('Error creating/updating admin:', error);
  } finally {
    process.exit(0);
  }
}

seedAdmin();
