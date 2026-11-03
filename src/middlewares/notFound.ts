import { Request, Response } from 'express';

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    status: false,
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`,
  });
};

