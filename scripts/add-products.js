const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addProducts() {
  console.log('🛍️ Ürünler ekleniyor...');

  try {
    const products = [
      {
        sku: '8683030770925',
        name: 'GO WALK FLEX RAY',
        description: 'Rahat yürüyüş ayakkabısı',
        price: 899.99,
        category: 'Ayakkabı',
        brand: 'Skechers',
        color: 'Siyah',
        size: '9',
        imageUrl: '/shoes/shoe.svg',
        isActive: true
      },
      {
        sku: '198739626223',
        name: 'GO WALK 8 PATE',
        description: 'Spor ayakkabı',
        price: 799.99,
        category: 'Ayakkabı',
        brand: 'Skechers',
        color: 'Mavi',
        size: '8',
        imageUrl: '/shoes/shoe.svg',
        isActive: true
      },
      {
        sku: '198739931709',
        name: 'EQUALIZER 5.0 TRAIL',
        description: 'Doğa yürüyüş ayakkabısı',
        price: 999.99,
        category: 'Ayakkabı',
        brand: 'Skechers',
        color: 'Kahverengi',
        size: '10',
        imageUrl: '/shoes/shoe.svg',
        isActive: true
      },
      {
        sku: '8683030780900',
        name: 'GO WALK FLEX RAY',
        description: 'Rahat yürüyüş ayakkabısı',
        price: 899.99,
        category: 'Ayakkabı',
        brand: 'Skechers',
        color: 'Gri',
        size: '7',
        imageUrl: '/shoes/shoe.svg',
        isActive: true
      },
      {
        sku: '198739626224',
        name: 'GO WALK 8 PATE',
        description: 'Spor ayakkabı',
        price: 799.99,
        category: 'Ayakkabı',
        brand: 'Skechers',
        color: 'Siyah',
        size: '9',
        imageUrl: '/shoes/shoe.svg',
        isActive: true
      },
      {
        sku: '198739931710',
        name: 'EQUALIZER 5.0 TRAIL',
        description: 'Doğa yürüyüş ayakkabısı',
        price: 999.99,
        category: 'Ayakkabı',
        brand: 'Skechers',
        color: 'Mavi',
        size: '8',
        imageUrl: '/shoes/shoe.svg',
        isActive: true
      }
    ];

    for (const product of products) {
      await prisma.product.upsert({
        where: { sku: product.sku },
        update: {},
        create: product
      });
      console.log(`✅ ${product.sku}: ${product.name} eklendi`);
    }

    console.log('\n🎉 Tüm ürünler başarıyla eklendi!');

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addProducts();
