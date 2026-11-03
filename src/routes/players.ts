import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { HttpError } from '../utils/errors';
import { Currency } from '@prisma/client';

const parsePlayerId = (param: string | string[] | undefined): number => {
  const val = Array.isArray(param) ? param[0] : param;
  return val ? parseInt(val, 10) : NaN;
};

export const playersRouter = Router();

// POST /api/players
playersRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nickname } = req.body;

    if (!nickname || typeof nickname !== 'string' || nickname.trim() === '') {
      throw new HttpError(400, 'Nickname wajib diisi');
    }

    const trimmedNickname = nickname.trim();

    const existingPlayer = await prisma.player.findUnique({
      where: { nickname: trimmedNickname },
    });

    if (existingPlayer) {
      throw new HttpError(409, 'Nickname sudah dipakai');
    }

    const player = await prisma.player.create({
      data: {
        nickname: trimmedNickname,
      },
    });

    res.status(201).json({
      status: true,
      message: 'Player berhasil dibuat',
      data: {
        id: player.id,
        nickname: player.nickname,
        bp: player.bp,
        diamond: player.diamond,
        createdAt: player.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/players/:player_id
playersRouter.get('/:player_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const playerId = parsePlayerId(req.params.player_id);
    if (isNaN(playerId)) {
      throw new HttpError(404, 'Player tidak ditemukan');
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        heroes: {
          include: {
            hero: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!player) {
      throw new HttpError(404, 'Player tidak ditemukan');
    }

    res.status(200).json({
      status: true,
      message: 'Berhasil mengambil data player',
      data: {
        id: player.id,
        nickname: player.nickname,
        bp: player.bp,
        diamond: player.diamond,
        createdAt: player.createdAt,
        heroes: player.heroes.map((ph) => ({
          heroId: ph.heroId,
          name: ph.hero.name,
          currency: ph.currency,
          pricePaid: ph.pricePaid,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/players/:player_id
playersRouter.patch('/:player_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const playerId = parsePlayerId(req.params.player_id);
    if (isNaN(playerId)) {
      throw new HttpError(404, 'Player tidak ditemukan');
    }

    const { nickname } = req.body;

    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) {
      throw new HttpError(404, 'Player tidak ditemukan');
    }

    if (!nickname || typeof nickname !== 'string' || nickname.trim() === '') {
      throw new HttpError(400, 'Nickname wajib diisi');
    }

    const trimmedNickname = nickname.trim();

    const existingPlayer = await prisma.player.findUnique({
      where: { nickname: trimmedNickname },
    });
    if (existingPlayer && existingPlayer.id !== playerId) {
      throw new HttpError(409, 'Nickname sudah dipakai player lain');
    }

    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: { nickname: trimmedNickname },
    });

    res.status(200).json({
      status: true,
      message: 'Player berhasil diperbarui',
      data: updatedPlayer,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/players/:player_id
playersRouter.delete('/:player_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const playerId = parsePlayerId(req.params.player_id);
    if (isNaN(playerId)) {
      throw new HttpError(404, 'Player tidak ditemukan');
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) {
      throw new HttpError(404, 'Player tidak ditemukan');
    }

    await prisma.player.delete({
      where: { id: playerId },
    });

    res.status(200).json({
      status: true,
      message: 'Player berhasil dihapus',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/players/:player_id/topup
playersRouter.post('/:player_id/topup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const playerId = parsePlayerId(req.params.player_id);
    const { amount } = req.body;

    // 1. amount bukan bilangan bulat lebih dari 0 -> 400
    if (
      typeof amount !== 'number' ||
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      throw new HttpError(400, 'Amount harus berupa bilangan bulat lebih dari 0');
    }

    // 2. Player tidak ditemukan -> 404
    if (isNaN(playerId)) {
      throw new HttpError(404, 'Player tidak ditemukan');
    }
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) {
      throw new HttpError(404, 'Player tidak ditemukan');
    }

    // 3. Berhasil: tambah diamond player dengan increment, lalu balas 200
    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: {
        diamond: { increment: amount },
      },
    });

    res.status(200).json({
      status: true,
      message: 'Top up berhasil',
      data: {
        playerId: updatedPlayer.id,
        amount,
        diamond: updatedPlayer.diamond,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/players/:player_id/matches
playersRouter.post('/:player_id/matches', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const playerId = parsePlayerId(req.params.player_id);
    const { result } = req.body;

    // 1. result bukan WIN/LOSE -> 400
    if (result !== 'WIN' && result !== 'LOSE') {
      throw new HttpError(400, 'Result harus bernilai WIN atau LOSE');
    }

    // 2. Player tidak ditemukan -> 404
    if (isNaN(playerId)) {
      throw new HttpError(404, 'Player tidak ditemukan');
    }
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) {
      throw new HttpError(404, 'Player tidak ditemukan');
    }

    // 3. Berhasil: tambah bp player (WIN 300, LOSE 100) dengan increment
    const bpEarned = result === 'WIN' ? 300 : 100;
    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: {
        bp: { increment: bpEarned },
      },
    });

    res.status(200).json({
      status: true,
      message: 'Hadiah match berhasil ditambahkan',
      data: {
        playerId: updatedPlayer.id,
        result,
        bpEarned,
        bp: updatedPlayer.bp,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/players/:player_id/heroes (Beli Hero)
playersRouter.post('/:player_id/heroes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const playerId = parsePlayerId(req.params.player_id);
    const { heroId, currency } = req.body;

    // 1. heroId kosong, atau currency bukan BP/DIAMOND -> 400
    if (
      heroId === undefined ||
      heroId === null ||
      typeof heroId !== 'number' ||
      !Number.isInteger(heroId) ||
      (currency !== 'BP' && currency !== 'DIAMOND')
    ) {
      throw new HttpError(400, 'heroId dan currency (BP atau DIAMOND) wajib diisi dengan benar');
    }

    // 2. Player tidak ditemukan -> 404
    if (isNaN(playerId)) {
      throw new HttpError(404, 'Player tidak ditemukan');
    }
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });
    if (!player) {
      throw new HttpError(404, 'Player tidak ditemukan');
    }

    // 3. Hero tidak ditemukan -> 404
    const hero = await prisma.hero.findUnique({
      where: { id: heroId },
    });
    if (!hero) {
      throw new HttpError(404, 'Hero tidak ditemukan');
    }

    // 4. Harga hero untuk currency tersebut kosong -> 400
    const price = currency === 'BP' ? hero.priceBP : hero.priceDiamond;
    if (price === null || price === undefined) {
      throw new HttpError(400, `Hero ${hero.name} tidak bisa dibeli dengan ${currency}`);
    }

    // 5. Player sudah memiliki hero tersebut -> 409
    const alreadyOwned = await prisma.playerHero.findUnique({
      where: {
        playerId_heroId: {
          playerId,
          heroId: hero.id,
        },
      },
    });
    if (alreadyOwned) {
      throw new HttpError(409, `Player sudah memiliki hero ${hero.name}`);
    }

    // 6. Saldo player kurang dari harga hero -> 400
    const currentBalance = currency === 'BP' ? player.bp : player.diamond;
    if (currentBalance < price) {
      throw new HttpError(400, `Saldo ${currency} tidak mencukupi`);
    }

    // Simpan dengan transaction
    const [updatedPlayer] = await prisma.$transaction([
      prisma.player.update({
        where: { id: playerId },
        data:
          currency === 'BP'
            ? { bp: { decrement: price } }
            : { diamond: { decrement: price } },
      }),
      prisma.playerHero.create({
        data: {
          playerId,
          heroId: hero.id,
          currency: currency as Currency,
          pricePaid: price,
        },
      }),
    ]);

    res.status(201).json({
      status: true,
      message: 'Hero berhasil dibeli',
      data: {
        hero: {
          id: hero.id,
          name: hero.name,
        },
        currency,
        pricePaid: price,
        balance: {
          bp: updatedPlayer.bp,
          diamond: updatedPlayer.diamond,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});
