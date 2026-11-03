import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { HttpError } from '../utils/errors';

export const errorHandler: ErrorRequestHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      status: false,
      message: err.message,
    });
    return;
  }

  console.error('Unhandled Error:', err);
  const status = typeof err?.statusCode === 'number' ? err.statusCode : 500;
  res.status(status).json({
    status: false,
    message: err.message || 'Terjadi kesalahan pada server',
  });
};

