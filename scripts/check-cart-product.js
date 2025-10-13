const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCartProduct() {
  try {
    const product = await prisma.product.findFirst({
      where: { sku: '8683030770925' },
      select: { name: true, imageUrl: true }
    });
    
    console.log('Sepetteki ürün:', product);
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCartProduct();
