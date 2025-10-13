const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCartItems() {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { sku: '8683030770925' },
      select: { title: true, imageUrl: true, sku: true }
    });
    
    console.log('Sepet öğeleri:');
    cartItems.forEach(item => console.log(`${item.title} → ${item.imageUrl}`));
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCartItems();
