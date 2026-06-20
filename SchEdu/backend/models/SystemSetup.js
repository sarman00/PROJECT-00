const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const JSON_TYPE = (sequelize.getDialect && sequelize.getDialect() === 'postgres') ? DataTypes.JSONB : DataTypes.JSON;

const SystemSetup = sequelize.define('SystemSetup', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  academic_year: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  current_semester: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  working_days: {
    type: JSON_TYPE,
    defaultValue: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  },
  periods_per_day: {
    type: DataTypes.INTEGER,
    defaultValue: 8
  },
  period_duration: {
    type: DataTypes.INTEGER,
    defaultValue: 50
  },
  break_times: {
    type: JSON_TYPE
  },
  csp_settings: {
    type: JSON_TYPE
  },
  leave_settings: {
    type: JSON_TYPE
  },
  notification_settings: {
    type: JSON_TYPE
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'system_setup',
  timestamps: true,
  underscored: true
});

module.exports = SystemSetup;
