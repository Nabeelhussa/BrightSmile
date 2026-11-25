import { getDialect, queryOne } from '../db/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getHealth = asyncHandler(async (_req, res) => {
  try {
    await queryOne('SELECT 1 AS ok');
    res.status(200).json({
      success: true,
      data: {
        status: 'ok',
        database: 'connected',
        dialect: getDialect(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database health check failed.',
      },
    });
  }
});
