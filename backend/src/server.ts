import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/db';
import { authMiddleware } from './middleware/auth';

import authRoutes from './routes/authRoutes';
import classRoutes from './routes/classRoutes';
import taskRoutes from './routes/taskRoutes';
import eventRoutes from './routes/eventRoutes';
import focusRoutes from './routes/focusRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all in local development
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', authMiddleware, classRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/events', authMiddleware, eventRoutes);
app.use('/api/focus', authMiddleware, focusRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Solana Productivity API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Root welcome
app.get('/', (req: Request, res: Response) => {
  res.send('🌿 Solana Productivity Backend is running smoothly.');
});

// Start Server and initialize DB
const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Solana server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start Solana server:', error);
    process.exit(1);
  }
};

startServer();
