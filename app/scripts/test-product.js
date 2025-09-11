const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTestProduct() {
  try {
    const product = await prisma.product.create({
      data: {
        sku: '8801234567890',
        name: 'Skechers D\'Lites - Summer Fiesta',
        description: 'Konforlu ve şık günlük ayakkabı. Hafif yapısı ve nefes alabilen malzemesi ile gün boyu rahatlık sağlar.',
        imageUrl: 'https://images.skechers.com/img/products/8801234567890_1.jpg',
        price: 1861.00,
        category: 'Ayakkabı',
        brand: 'Skechers',
        color: 'Siyah',
        size: '36-42',
        isActive: true
      }
    });
    
    console.log('✅ Test product added:', product);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestProduct();
