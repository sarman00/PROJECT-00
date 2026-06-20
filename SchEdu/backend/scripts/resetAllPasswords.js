const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { sequelize, User } = require('../models');

async function main() {
  try {
    console.log('Resetting all user passwords to pass123 ...');
    await sequelize.authenticate();
    const users = await User.findAll();
    let updated = 0;
    for (const u of users) {
      u.password = 'pass123'; // model hooks will hash on save
      await u.save();
      updated += 1;
    }
    console.log(`Updated ${updated} users.`);
  } catch (err) {
    console.error('Failed to reset passwords:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close().catch(() => {});
  }
}

main();

