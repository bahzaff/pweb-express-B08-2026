import express from 'express';
import { logger } from './middlewares/logger';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';
import { heroesRouter } from './routes/heroes';
import { skinsRouter } from './routes/skins';
import { playersRouter } from './routes/players';
import { statisticsRouter } from './routes/statistics';

export const app = express();

app.use(express.json());
app.use(logger);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: true,
    message: 'Server berjalan dengan baik',
  });
});

// API Routes
app.use('/api/heroes', heroesRouter);
app.use('/api/skins', skinsRouter);
app.use('/api/players', playersRouter);
app.use('/api/statistics', statisticsRouter);

// 404 Handler
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

