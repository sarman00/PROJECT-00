const express = require('express');
const { body } = require('express-validator');
const { Notification } = require('../models');
const validateRequest = require('../middleware/validationMiddleware');
const router = express.Router();

router.post(
  '/',
  [
    body('recipient_id').isInt().withMessage('Valid recipient required'),
    body('recipient_type').optional().isIn(['individual', 'role', 'department', 'broadcast']),
    body('type').optional().isString(),
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('status').optional().isIn(['unread', 'read', 'dismissed']),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const notification = await Notification.create(req.body);
      res.status(201).json(notification);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.get('/user/:userId', async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { recipient_id: req.params.userId, is_active: true },
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/user/:userId/unread', async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { recipient_id: req.params.userId, status: 'unread', is_active: true },
      order: [['createdAt', 'DESC']]
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    notification.status = 'read';
    notification.read_at = new Date();
    await notification.save();
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/user/:userId/read-all', async (req, res) => {
  try {
    await Notification.update(
      { status: 'read', read_at: new Date() },
      { where: { recipient_id: req.params.userId, status: 'unread' } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [updatedCount] = await Notification.update({ is_active: false }, { where: { id: req.params.id } });
    if (updatedCount === 0) return res.status(404).json({ error: 'Notification not found' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
