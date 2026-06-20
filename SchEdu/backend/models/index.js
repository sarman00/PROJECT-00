const sequelize = require('../config/db');

const User = require('./User');
const Class = require('./Class');
const Subject = require('./Subject');
const Leave = require('./Leave');
const Timetable = require('./Timetable');
const Notification = require('./Notification');
const SystemSetup = require('./SystemSetup');

// Associations
User.hasMany(Leave, { foreignKey: 'teacher_id', as: 'leaves' });
Leave.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });

Class.hasMany(Timetable, { foreignKey: 'class_id' });
Timetable.belongsTo(Class, { foreignKey: 'class_id' });

User.hasMany(Notification, { foreignKey: 'recipient_id' });
Notification.belongsTo(User, { foreignKey: 'recipient_id' });

// Sync models
async function syncModels() {
  await sequelize.sync({ alter: true });
}

module.exports = {
  sequelize,
  User,
  Class,
  Subject,
  Leave,
  Timetable,
  Notification,
  SystemSetup,
  syncModels
};

