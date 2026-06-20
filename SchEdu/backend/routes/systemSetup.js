const express = require('express');
const { body } = require('express-validator');
const { SystemSetup } = require('../models');
const validateRequest = require('../middleware/validationMiddleware');
const router = express.Router();

router.post(
  '/',
  [
    body('academic_year').notEmpty().withMessage('Academic year required'),
    body('current_semester').isInt().withMessage('Current semester required'),
    body('working_days').optional().isArray(),
    body('periods_per_day').optional().isInt(),
    body('period_duration').optional().isInt(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const setup = await SystemSetup.create(req.body);
      res.status(201).json(setup);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.get('/current', async (req, res) => {
  try {
    const setup = await SystemSetup.findOne({ where: { is_active: true }, order: [['createdAt', 'DESC']] });
    if (!setup) return res.status(404).json({ error: 'No active system setup found' });
    res.json(setup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const setups = await SystemSetup.findAll({ order: [['createdAt', 'DESC']] });
    res.json(setups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const [updatedCount] = await SystemSetup.update(req.body, { where: { id: req.params.id } });
    if (updatedCount === 0) return res.status(404).json({ error: 'System setup not found' });
    const updated = await SystemSetup.findByPk(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id/csp-settings', async (req, res) => {
  try {
    const setup = await SystemSetup.findByPk(req.params.id);
    if (!setup) return res.status(404).json({ error: 'System setup not found' });

    setup.csp_settings = { ...setup.csp_settings, ...req.body };
    await setup.save();
    res.json(setup);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const setup = await SystemSetup.findByPk(req.params.id);
    if (!setup) return res.status(404).json({ error: 'System setup not found' });
    res.json(setup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
