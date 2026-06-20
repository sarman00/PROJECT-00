const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const JSON_TYPE = (sequelize.getDialect && sequelize.getDialect() === 'postgres') ? DataTypes.JSONB : DataTypes.JSON;

const Timetable = sequelize.define('Timetable', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  class_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'classes',
      key: 'id'
    }
  },
  academic_year: {
    type: DataTypes.STRING(15)
  },
  semester: {
    type: DataTypes.INTEGER
  },
  schedule: {
    type: JSON_TYPE,
    allowNull: false
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  last_optimized: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'timetables',
  timestamps: true,
  underscored: true
});

module.exports = Timetable;
