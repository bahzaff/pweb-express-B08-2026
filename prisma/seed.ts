import fs from 'fs';
import path from 'path';
import { prisma } from '../src/prisma';

async function main() {
  console.log('Seeding database...');

  // 1. Kosongkan semua tabel dengan raw query
  await prisma.$executeRawUnsafe(
    'TRUNCATE "PlayerHero", "Player", "Skin", "Hero" RESTART IDENTITY CASCADE;'
  );
  console.log('Tables truncated and identities restarted.');

  // 2. Baca data/heroes.json dan masukkan dengan createMany
  const heroesPath = path.join(__dirname, '../data/heroes.json');
  const heroesData = JSON.parse(fs.readFileSync(heroesPath, 'utf-8'));

  await prisma.hero.createMany({
    data: heroesData,
  });
  console.log(`Inserted ${heroesData.length} heroes.`);

  // 3. Baca data/skins.json dan masukkan dengan createMany
  const skinsPath = path.join(__dirname, '../data/skins.json');
  const skinsData = JSON.parse(fs.readFileSync(skinsPath, 'utf-8'));

  await prisma.skin.createMany({
    data: skinsData,
  });
  console.log(`Inserted ${skinsData.length} skins.`);

  // 4. Masukkan 3 player
  await prisma.player.createMany({
    data: [
      { nickname: 'ArekITS', bp: 1500, diamond: 75 },
      { nickname: 'SangPushRank', bp: 13000, diamond: 2892 },
      { nickname: 'MageSurabaya', bp: 10000, diamond: 0 },
    ],
  });
  console.log('Inserted 3 players.');

  // Masukkan data PlayerHero
  await prisma.playerHero.createMany({
    data: [
      { playerId: 1, heroId: 18, currency: 'BP', pricePaid: 2000 },
      { playerId: 1, heroId: 1, currency: 'BP', pricePaid: 10800 },
      { playerId: 2, heroId: 84, currency: 'DIAMOND', pricePaid: 599 },
      { playerId: 2, heroId: 56, currency: 'BP', pricePaid: 32000 },
    ],
  });
  console.log('Inserted initial PlayerHero records.');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

