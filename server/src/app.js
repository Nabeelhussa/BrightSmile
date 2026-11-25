import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import healthRoutes from './routes/healthRoutes.js';
import doctorsRoutes from './routes/doctorsRoutes.js';
import appointmentsRoutes from './routes/appointmentsRoutes.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '1mb' }));

  app.get('/', (_req, res) => {
    res.json({
      success: true,
      data: {
        name: 'BrightSmile Dental Clinic Management API',
        version: '1.0.0',
        health: '/api/health',
      },
    });
  });

  app.use('/api/health', healthRoutes);
  app.use('/api/doctors', doctorsRoutes);
  app.use('/api/appointments', appointmentsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
