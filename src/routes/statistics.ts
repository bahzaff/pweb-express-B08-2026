import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export const statisticsRouter = Router();

// GET /api/statistics
statisticsRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalPlayers, totalHeroesOwned, diamondAgg, heroGroups, roleGroups] = await Promise.all([
      prisma.player.count(),
      prisma.playerHero.count(),
      prisma.player.aggregate({
        _sum: {
          diamond: true,
        },
      }),
      prisma.playerHero.groupBy({
        by: ['heroId'],
        _count: {
          heroId: true,
        },
        orderBy: {
          _count: {
            heroId: 'desc',
          },
        },
        take: 1,
      }),
      prisma.hero.groupBy({
        by: ['role'],
        _count: {
          role: true,
        },
        orderBy: {
          _count: {
            role: 'desc',
          },
        },
      }),
    ]);

    let mostOwnedHero: { heroId: number; name: string; owners: number } | null = null;
    if (heroGroups.length > 0) {
      const topHero = heroGroups[0];
      const heroInfo = await prisma.hero.findUnique({
        where: { id: topHero.heroId },
        select: { name: true },
      });
      mostOwnedHero = {
        heroId: topHero.heroId,
        name: heroInfo?.name || '',
        owners: topHero._count.heroId,
      };
    }

    const heroesPerRole = roleGroups.map((rg) => ({
      role: rg.role,
      total: rg._count.role,
    }));

    res.status(200).json({
      status: true,
      message: 'Berhasil mengambil statistik',
      data: {
        totalPlayers,
        totalHeroesOwned,
        totalDiamond: diamondAgg._sum.diamond ?? 0,
        mostOwnedHero,
        heroesPerRole,
      },
    });
  } catch (error) {
    next(error);
  }
});

