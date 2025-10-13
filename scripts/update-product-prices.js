const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('💰 Ürün fiyatları güncelleniyor...');

  // Skechers ürünleri için fiyat güncellemesi
  const priceUpdates = [
    // GO WALK FLEX RAY serisi - Premium ürünler
    { pattern: 'GO WALK FLEX RAY', price: 1299.99 },
    
    // GO WALK 8 PATE serisi - Orta segment
    { pattern: 'GO WALK 8 PATE', price: 999.99 },
    
    // EQUALIZER serisi - Spor ayakkabı
    { pattern: 'EQUALIZER', price: 1199.99 },
    
    // HILLCREST serisi - Outdoor
    { pattern: 'HILLCREST', price: 1099.99 }
  ];

  for (const update of priceUpdates) {
    const products = await prisma.product.findMany({
      where: {
        name: {
          contains: update.pattern
        },
        brand: 'Skechers'
      }
    });

    console.log(`📦 ${update.pattern} serisi: ${products.length} ürün bulundu`);

    for (const product of products) {
      await prisma.product.update({
        where: { id: product.id },
        data: { price: update.price }
      });
      console.log(`✅ ${product.name} - ₺${update.price}`);
    }
  }

  // Tüm Skechers ürünlerini kontrol et
  const allSkechersProducts = await prisma.product.findMany({
    where: { brand: 'Skechers' }
  });

  console.log(`\n📊 Özet:`);
  console.log(`📦 Toplam Skechers ürünü: ${allSkechersProducts.length}`);
  
  const priceStats = allSkechersProducts.reduce((acc, product) => {
    if (product.price > 0) {
      acc.withPrice++;
      acc.totalPrice += product.price;
    } else {
      acc.withoutPrice++;
    }
    return acc;
  }, { withPrice: 0, withoutPrice: 0, totalPrice: 0 });

  console.log(`💰 Fiyatı olan: ${priceStats.withPrice} ürün`);
  console.log(`❌ Fiyatı olmayan: ${priceStats.withoutPrice} ürün`);
  
  if (priceStats.withPrice > 0) {
    console.log(`📈 Ortalama fiyat: ₺${(priceStats.totalPrice / priceStats.withPrice).toFixed(2)}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
