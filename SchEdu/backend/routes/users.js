const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Manage users (dev tools)
 */

// Middleware to handle validation results
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  next();
}

// Create user with validations and unique email check
/**
 * @swagger
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, first_name, last_name, role]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               role: { type: string, enum: [teacher, student, admin] }
 *     responses:
 *       201: { description: Created }
 *       409: { description: Email already registered }
 */
router.post(
  '/',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars'),
    body('first_name').notEmpty().withMessage('First name required'),
    body('last_name').notEmpty().withMessage('Last name required'),
    body('role').isIn(['teacher', 'student', 'admin']).withMessage('Invalid role'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { email, password, first_name, last_name, role } = req.body;

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: 'Email already registered' });
      }

      // Password hashing is handled on model hook, so pass raw password
      const newUser = await User.create({
        email, password, first_name, last_name, role,
      });

      res.status(201).json({ id: newUser.id, email: newUser.email });
    } catch (err) {
      console.error('Create user error:', err.name, err.errors?.map(e => ({ message: e.message, path: e.path, value: e.value })));
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// Delete user by email - for test cleanup only (use with caution)
/**
 * @swagger
 * /api/users/email/{email}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user by email (dev only)
 *     parameters:
 *       - in: path
 *         name: email
 *         schema: { type: string, format: email }
 *         required: true
 *     responses:
 *       204: { description: No Content }
 *       404: { description: Not found }
 */
router.delete('/email/:email', async (req, res) => {
  try {
    const deleted = await User.destroy({ where: { email: req.params.email } });
    if (deleted === 0) return res.status(404).json({ message: 'User not found' });
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all users
/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: List users
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get user by id with 404
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by id
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update user with validations and password hashing if changed
router.put(
  '/:id',
  [
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password min 6 chars'),
    body('first_name').optional().notEmpty(),
    body('last_name').optional().notEmpty(),
    body('role').optional().isIn(['teacher', 'student', 'admin']),
  ],
  validateRequest,
  async (req, res) => {
    try {
      if (req.body.password) {
        req.body.password = await bcrypt.hash(req.body.password, 10);
      }

      const [updated] = await User.update(req.body, { where: { id: req.params.id } });
      if (updated === 0) return res.status(404).json({ message: 'User not found' });

      const updatedUser = await User.findByPk(req.params.id);
      res.json(updatedUser);
    } catch (err) {
      res.status(400).json({ message: 'Update failed', error: err.message });
    }
  }
);

// Delete user by id
/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user by id
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       204: { description: No Content }
 *       404: { description: Not found }
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await User.destroy({ where: { id: req.params.id } });
    if (deleted === 0) return res.status(404).json({ message: 'User not found' });
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ message: 'Delete failed', error: err.message });
  }
});

module.exports = router;
