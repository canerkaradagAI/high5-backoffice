const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRecommendedProducts() {
  try {
    const products = await prisma.product.findMany({
      where: { 
        name: { contains: 'HILLCREST' }, 
        size: { in: ['9.5', '9', '8.5'] } 
      },
      select: { name: true, imageUrl: true, size: true }
    });
    
    console.log('Önerilen HILLCREST ürünleri:');
    products.forEach(p => console.log(`${p.name} → ${p.imageUrl}`));
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecommendedProducts();
