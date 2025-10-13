const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkHillcrestProducts() {
  try {
    const products = await prisma.product.findMany({
      where: { name: { contains: 'HILLCREST' } },
      select: { name: true, imageUrl: true }
    });
    
    console.log('HILLCREST ürünleri:');
    products.forEach(p => console.log(`${p.name} → ${p.imageUrl}`));
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkHillcrestProducts();
