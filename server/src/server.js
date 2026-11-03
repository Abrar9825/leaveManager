import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { seedDatabase } from './utils/seedData.js';
import leaveRoutes from './routes/leaveRoutes.js';
import balanceRoutes from './routes/balanceRoutes.js';
import authRoutes from './routes/authRoutes.js';
import holidayRoutes from './routes/holidayRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import taskRoutes from './routes/taskRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB & Seed default records
await connectDB();
await seedDatabase();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'MongoDB connected',
  });
});

// API Routes
app.use('/api/leaves', leaveRoutes);
app.use('/api/balance', balanceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/tasks', taskRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error(`[Server Error] ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Server] Leave Management API is running on http://127.0.0.1:${PORT}`);
});
