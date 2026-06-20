const express = require('express');
require('dotenv').config();

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const sequelize = require('./config/db');

const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');
const userRoutes = require('./routes/users');
const classRoutes = require('./routes/classes');
const subjectRoutes = require('./routes/subjects');
const leaveRoutes = require('./routes/leaves');
const timetableRoutes = require('./routes/timetables');
const notificationRoutes = require('./routes/notifications');
const systemSetupRoutes = require('./routes/systemSetup');

const errorHandler = require('./middleware/errorHandler');
const setupSwagger = require('./swagger');

const app = express();

// Logger middleware
app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.url);
  next();
});

// Security Middlewares
app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000', // CRA default dev URL
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP per windowMs
});
app.use(limiter);

// Parse JSON request bodies
app.use(express.json());

// Swagger setup for API docs
setupSwagger(app);

// Route Handlers
app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/system-setup', systemSetupRoutes);

// Test route
app.get('/test', (req, res) => {
  res.send('Server is working!');
});

// Error handling middleware (must come after all routes)
app.use(errorHandler);

// Export app for testing or other purposes
module.exports = app;

// Start server only if file is run directly
if (require.main === module) {
  const startServer = async () => {
    try {
      await sequelize.sync();
      console.log('Database synced successfully.');

      const PORT = process.env.PORT || 3001;
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    } catch (error) {
      console.error('Error syncing database:', error);
      process.exit(1);
    }
  };

  startServer();
}
