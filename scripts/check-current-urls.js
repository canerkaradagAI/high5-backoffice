const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCurrentUrls() {
  try {
    const products = await prisma.product.findMany({
      where: { brand: 'Skechers' },
      select: { name: true, imageUrl: true },
      take: 5
    });
    
    console.log('Mevcut görsel URL\'leri:');
    products.forEach(p => console.log(`${p.name} → ${p.imageUrl}`));
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentUrls();
