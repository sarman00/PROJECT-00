const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const JSON_TYPE = (sequelize.getDialect && sequelize.getDialect() === 'postgres') ? DataTypes.JSONB : DataTypes.JSON;

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  recipient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  recipient_type: {
    type: DataTypes.ENUM('individual', 'role', 'department', 'broadcast'),
    defaultValue: 'individual'
  },
  type: {
    type: DataTypes.STRING(50)
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  data: {
    type: JSON_TYPE
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('unread', 'read', 'dismissed'),
    defaultValue: 'unread'
  },
  scheduled_for: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  delivered_at: DataTypes.DATE,
  read_at: DataTypes.DATE,
  expires_at: DataTypes.DATE,
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: true
});

module.exports = Notification;
