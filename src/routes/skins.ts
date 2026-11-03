import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { HttpError } from '../utils/errors';
import { Rarity } from '@prisma/client';

export const skinsRouter = Router();

// GET /api/skins
skinsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const heroId = req.query.heroId ? parseInt(req.query.heroId as string, 10) : undefined;
    const rarity = req.query.rarity as string | undefined;

    const where: any = {};

    if (heroId && !isNaN(heroId)) {
      where.heroId = heroId;
    }

    if (rarity && Object.values(Rarity).includes(rarity as Rarity)) {
      where.rarity = rarity as Rarity;
    }

    const [skins, totalItems] = await Promise.all([
      prisma.skin.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'asc' },
        include: {
          hero: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.skin.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      status: true,
      message: 'Berhasil mengambil data skin',
      data: skins,
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

// GET /api/skins/:skin_id
skinsRouter.get('/:skin_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skinId = parseInt(Array.isArray(req.params.skin_id) ? req.params.skin_id[0] : req.params.skin_id, 10);
    if (isNaN(skinId)) {
      throw new HttpError(404, 'Skin tidak ditemukan');
    }

    const skin = await prisma.skin.findUnique({
      where: { id: skinId },
      include: {
        hero: true,
      },
    });

    if (!skin) {
      throw new HttpError(404, 'Skin tidak ditemukan');
    }

    res.status(200).json({
      status: true,
      message: 'Berhasil mengambil data skin',
      data: skin,
    });
  } catch (error) {
    next(error);
  }
});
