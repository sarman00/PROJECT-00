const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { body } = require('express-validator');
const validateRequest = require('../middleware/validationMiddleware');

const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key_here';

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication endpoints
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [teacher, student, admin]
 *     responses:
 *       201:
 *         description: User registered
 *       409:
 *         description: Email already registered
 *       400:
 *         description: Validation error
 */
// Register route
router.post(
  '/register',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
    body('role')
      .optional()
      .isIn(['teacher', 'student', 'admin'])
      .withMessage('Invalid role'),
  ],
  validateRequest,
  async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
      const normalizedEmail = email.toLowerCase();
      const normalizedRole = role ? role.toLowerCase() : undefined;

      const existingUser = await User.findOne({ where: { email: normalizedEmail } });
      if (existingUser)
        return res.status(409).json({ message: 'Email already registered' });

      // Password hashing is done by Sequelize hook, no need to hash here
      const user = await User.create({
        first_name: username,
        last_name: 'LastName', // You might want to collect this from client or defaults
        email: normalizedEmail,
        password: password,
        role: normalizedRole,
      });

      res.status(201).json({ message: 'User registered', userId: user.id });
    } catch (err) {
      console.error('Register error:', err.name, err.errors?.map(e => ({ message: e.message, path: e.path, value: e.value })));
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [teacher, student, admin]
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Invalid credentials
 */
// Login route (role optional)
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('role').optional().isIn(['teacher', 'student', 'admin']).withMessage('Invalid role'),
  ],
  validateRequest,
  async (req, res) => {
    const { email, password, role } = req.body;

    try {
      const normalizedEmail = email.toLowerCase();
      const normalizedRole = role ? role.toLowerCase() : undefined;

      // Find user by email only; role is ignored for authentication and returned from DB
      const user = await User.findOne({ where: { email: normalizedEmail } });

      if (!user) return res.status(401).json({ message: 'Invalid credentials' });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

      const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        SECRET_KEY,
        { expiresIn: '8h' }
      );

      res.json({ token, role: user.role, id: user.id });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

module.exports = router;
