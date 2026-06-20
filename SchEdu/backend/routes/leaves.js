const express = require('express');
const { body } = require('express-validator');
const { Leave, User } = require('../models');
const { reassignLeave } = require('../services/cspService');
const validateRequest = require('../middleware/validationMiddleware');

const router = express.Router();

const MAX_LEAVE_DAYS_PER_MONTH = 4; // policy

function yyyymm(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function workingDaysByMonth(startStr, endStr) {
  const map = new Map();
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start) || isNaN(end) || start > end) return map;
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getDay(); // 0 Sun .. 6 Sat
    if (dow >= 1 && dow <= 5) {
      const key = yyyymm(cur);
      map.set(key, (map.get(key) || 0) + 1);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return map;
}

const leaveValidationRules = [
  body('teacher_id').isInt().withMessage('Valid teacher ID required'),
  body('leave_type').isIn(['sick', 'casual', 'emergency', 'maternity', 'study']).withMessage('Invalid leave type'),
  body('start_date').isISO8601().withMessage('Valid start date required'),
  body('end_date').isISO8601().withMessage('Valid end date required'),
  body('reason').notEmpty().withMessage('Reason required'),
  body('status').optional().isIn(['pending', 'approved', 'rejected', 'processed']),
  body('priority').optional().isInt({ min: 1, max: 5 }),
];

router.get('/', async (req, res) => {
  try {
    const leaves = await Leave.findAll({
      include: [{ model: User, as: 'teacher', attributes: ['first_name', 'last_name', 'email'] }],
      order: [['applied_at', 'DESC']],
    });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', leaveValidationRules, validateRequest, async (req, res) => {
  try {
    const { teacher_id, start_date, end_date } = req.body;

    // Compute requested working days per month
    const requested = workingDaysByMonth(start_date, end_date);

    // Fetch existing approved/processed leaves overlapping overall range boundaries
    const start = new Date(start_date);
    const end = new Date(end_date);
    const rangeStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const rangeEnd = new Date(end.getFullYear(), end.getMonth() + 1, 0);

    const existing = await Leave.findAll({
      where: {
        teacher_id,
        status: ['approved', 'processed'],
        start_date: { [require('sequelize').Op.lte]: rangeEnd },
        end_date: { [require('sequelize').Op.gte]: rangeStart },
      },
    });

    const existingCounts = new Map();
    for (const l of existing) {
      const m = workingDaysByMonth(l.start_date, l.end_date);
      for (const [k, v] of m.entries()) existingCounts.set(k, (existingCounts.get(k) || 0) + v);
    }

    // Check quota month-wise
    const violations = [];
    for (const [k, v] of requested.entries()) {
      const used = existingCounts.get(k) || 0;
      if (used + v > MAX_LEAVE_DAYS_PER_MONTH) {
        violations.push({ month: k, used, requested: v, limit: MAX_LEAVE_DAYS_PER_MONTH });
      }
    }

    if (violations.length > 0) {
      return res.status(400).json({
        message: 'Monthly leave quota exceeded',
        violations,
      });
    }

    // Auto-approve and process
    const leave = await Leave.create({ ...req.body, status: 'approved', approved_at: new Date(), approved_by: null });

    const result = await reassignLeave(leave.id);

    return res.status(201).json({ message: 'Leave auto-approved and timetable updated', leave: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/leaves/quota/{teacherId}:
 *   get:
 *     tags: [Leaves]
 *     summary: Get remaining leave working days for a month
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         schema: { type: integer }
 *         required: true
 *       - in: query
 *         name: month
 *         schema: { type: string, example: '2025-09' }
 *         required: false
 *     responses:
 *       200: { description: OK }
 */
router.get('/quota/:teacherId', async (req, res) => {
  try {
    const teacher_id = parseInt(req.params.teacherId, 10);
    const monthStr = req.query.month || yyyymm(new Date());
    const [year, month] = monthStr.split('-').map((n) => parseInt(n, 10));
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    const existing = await Leave.findAll({
      where: {
        teacher_id,
        status: ['approved', 'processed'],
        start_date: { [require('sequelize').Op.lte]: monthEnd },
        end_date: { [require('sequelize').Op.gte]: monthStart },
      },
    });

    let used = 0;
    for (const l of existing) {
      const m = workingDaysByMonth(l.start_date, l.end_date);
      used += m.get(monthStr) || 0;
    }
    const remaining = Math.max(0, MAX_LEAVE_DAYS_PER_MONTH - used);

    res.json({ teacher_id, month: monthStr, used, remaining, limit: MAX_LEAVE_DAYS_PER_MONTH });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const leaves = await Leave.findAll({
      where: { teacher_id: req.params.teacherId },
      order: [['applied_at', 'DESC']],
    });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/status/:status', async (req, res) => {
  try {
    const leaves = await Leave.findAll({
      where: { status: req.params.status },
      include: [{ model: User, as: 'teacher', attributes: ['first_name', 'last_name', 'email'] }],
      order: [['applied_at', 'DESC']],
    });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const leave = await Leave.findByPk(req.params.id, {
      include: [{ model: User, as: 'teacher', attributes: ['first_name', 'last_name', 'email'] }],
    });
    if (!leave) return res.status(404).json({ error: 'Leave not found' });
    res.json(leave);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const [updatedCount] = await Leave.update(req.body, { where: { id: req.params.id } });
    if (updatedCount === 0) {
      return res.status(404).json({ error: 'Leave not found' });
    }
    const updated = await Leave.findByPk(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// NOTE: Kept for debugging/manual ops, but not needed; leaves are auto-approved on creation
router.patch('/:id/approve', async (req, res) => {
  try {
    const leaveId = req.params.id;
    const leave = await Leave.findByPk(leaveId);
    if (!leave) return res.status(404).json({ error: 'Leave not found' });

    leave.status = 'approved';
    leave.approved_at = new Date();
    leave.approved_by = req.body.approved_by || null;
    await leave.save();

    const updatedLeave = await reassignLeave(leaveId);

    res.json({ message: 'Leave approved and timetable updated', leave: updatedLeave });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

router.patch('/:id/reject', async (req, res) => {
  try {
    const leave = await Leave.findByPk(req.params.id);
    if (!leave) return res.status(404).json({ error: 'Leave not found' });
    leave.status = 'rejected';
    await leave.save();
    res.json(leave);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
