const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const skechersProducts = [
  {
    id: 'prod1',
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
  },
  {
    id: 'prod2',
    sku: '8801234567891',
    name: 'Skechers Go Walk 5 - Comfort',
    description: 'Yürüyüş için özel tasarlanmış konforlu ayakkabı. 5GEN teknolojisi ile maksimum destek.',
    imageUrl: 'https://images.skechers.com/img/products/8801234567891_1.jpg',
    price: 1299.00,
    category: 'Ayakkabı',
    brand: 'Skechers',
    color: 'Beyaz',
    size: '36-42',
    isActive: true
  },
  {
    id: 'prod3',
    sku: '8801234567892',
    name: 'Skechers Flex Appeal 3.0',
    description: 'Spor ve günlük kullanım için ideal. Esnek taban yapısı ile doğal yürüyüş.',
    imageUrl: 'https://images.skechers.com/img/products/8801234567892_1.jpg',
    price: 1599.00,
    category: 'Ayakkabı',
    brand: 'Skechers',
    color: 'Gri',
    size: '36-42',
    isActive: true
  },
  {
    id: 'prod4',
    sku: '8801234567893',
    name: 'Skechers Uno - Stand On Air',
    description: 'Hava yastığı teknolojisi ile maksimum konfor. Modern tasarım ve üstün performans.',
    imageUrl: 'https://images.skechers.com/img/products/8801234567893_1.jpg',
    price: 2199.00,
    category: 'Ayakkabı',
    brand: 'Skechers',
    color: 'Mavi',
    size: '36-42',
    isActive: true
  },
  {
    id: 'prod5',
    sku: '8801234567894',
    name: 'Skechers Arch Fit - Go Walk',
    description: 'Ayak kemerini destekleyen özel taban yapısı. Uzun süreli kullanım için ideal.',
    imageUrl: 'https://images.skechers.com/img/products/8801234567894_1.jpg',
    price: 1799.00,
    category: 'Ayakkabı',
    brand: 'Skechers',
    color: 'Pembe',
    size: '36-42',
    isActive: true
  },
  {
    id: 'prod6',
    sku: '8801234567895',
    name: 'Skechers D\'Lites - Fresh Start',
    description: 'Retro tarzda modern konfor. Klasik tasarım ve çağdaş teknoloji bir arada.',
    imageUrl: 'https://images.skechers.com/img/products/8801234567895_1.jpg',
    price: 1499.00,
    category: 'Ayakkabı',
    brand: 'Skechers',
    color: 'Beyaz-Siyah',
    size: '36-42',
    isActive: true
  },
  {
    id: 'prod7',
    sku: '8801234567896',
    name: 'Skechers Go Run - Forza',
    description: 'Koşu için optimize edilmiş performans ayakkabısı. Hızlı ve konforlu koşu deneyimi.',
    imageUrl: 'https://images.skechers.com/img/products/8801234567896_1.jpg',
    price: 1999.00,
    category: 'Ayakkabı',
    brand: 'Skechers',
    color: 'Kırmızı',
    size: '36-42',
    isActive: true
  },
  {
    id: 'prod8',
    sku: '8801234567897',
    name: 'Skechers Relaxed Fit - D\'Lites',
    description: 'Rahat kesim ve yumuşak malzeme. Günlük kullanım için mükemmel konfor.',
    imageUrl: 'https://images.skechers.com/img/products/8801234567897_1.jpg',
    price: 1399.00,
    category: 'Ayakkabı',
    brand: 'Skechers',
    color: 'Kahverengi',
    size: '36-42',
    isActive: true
  },
  {
    id: 'prod9',
    sku: '8801234567898',
    name: 'Skechers Ultra Flex - 3.0',
    description: 'Ultra esnek taban yapısı. Doğal yürüyüş hareketini destekler.',
    imageUrl: 'https://images.skechers.com/img/products/8801234567898_1.jpg',
    price: 1699.00,
    category: 'Ayakkabı',
    brand: 'Skechers',
    color: 'Siyah-Beyaz',
    size: '36-42',
    isActive: true
  },
  {
    id: 'prod10',
    sku: '8801234567899',
    name: 'Skechers Go Walk Joy',
    description: 'Mutluluk veren konfor. Hafif yapısı ve yumuşak dokunuşu ile günlük kullanım için ideal.',
    imageUrl: 'https://images.skechers.com/img/products/8801234567899_1.jpg',
    price: 1199.00,
    category: 'Ayakkabı',
    brand: 'Skechers',
    color: 'Turuncu',
    size: '36-42',
    isActive: true
  }
];

async function addProducts() {
  console.log('🌱 Adding Skechers products...');
  
  for (const product of skechersProducts) {
    try {
      await prisma.product.upsert({
        where: { sku: product.sku },
        update: product,
        create: product
      });
      console.log(`✅ Added: ${product.name}`);
    } catch (error) {
      console.error(`❌ Error adding ${product.name}:`, error.message);
    }
  }
  
  console.log('🎉 Products added successfully!');
}

addProducts()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
