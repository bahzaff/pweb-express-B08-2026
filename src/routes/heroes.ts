import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { HttpError } from '../utils/errors';
import { Role, Lane } from '@prisma/client';

export const heroesRouter = Router();

// GET /api/heroes
heroesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const search = req.query.search as string | undefined;
    const role = req.query.role as string | undefined;

    const where: any = {};

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (role && Object.values(Role).includes(role as Role)) {
      where.role = role as Role;
    }

    const [heroes, totalItems] = await Promise.all([
      prisma.hero.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'asc' },
      }),
      prisma.hero.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      status: true,
      message: 'Berhasil mengambil data hero',
      data: heroes,
      metadata: {
        currentPage: page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/heroes/:hero_id
heroesRouter.get('/:hero_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const heroId = parseInt(Array.isArray(req.params.hero_id) ? req.params.hero_id[0] : req.params.hero_id, 10);
    if (isNaN(heroId)) {
      throw new HttpError(404, 'Hero tidak ditemukan');
    }

    const hero = await prisma.hero.findUnique({
      where: { id: heroId },
      include: { skins: true },
    });

    if (!hero) {
      throw new HttpError(404, 'Hero tidak ditemukan');
    }

    res.status(200).json({
      status: true,
      message: 'Berhasil mengambil data hero',
      data: hero,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/heroes
heroesRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, role, lane, releaseYear, priceBP, priceDiamond } = req.body;

    // 1. name, role, lane, atau releaseYear tidak diisi -> 400
    if (!name || !role || !lane || releaseYear === undefined || releaseYear === null || releaseYear === '') {
      throw new HttpError(400, 'name, role, lane, dan releaseYear wajib diisi');
    }

    // 2. Nama hero sudah ada -> 409
    const existingHero = await prisma.hero.findUnique({
      where: { name: String(name).trim() },
    });
    if (existingHero) {
      throw new HttpError(409, 'Nama hero sudah ada');
    }

    // 3. Berhasil -> 201
    const newHero = await prisma.hero.create({
      data: {
        name: String(name).trim(),
        role: role as Role,
        lane: lane as Lane,
        releaseYear: Number(releaseYear),
        priceBP: priceBP !== undefined && priceBP !== null && priceBP !== '' ? Number(priceBP) : null,
        priceDiamond:
          priceDiamond !== undefined && priceDiamond !== null && priceDiamond !== ''
            ? Number(priceDiamond)
            : null,
      },
    });

    res.status(201).json({
      status: true,
      message: 'Hero berhasil dibuat',
      data: newHero,
    });
  } catch (error) {
    next(error);
  }
});
