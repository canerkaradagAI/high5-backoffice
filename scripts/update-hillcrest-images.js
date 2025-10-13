const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🖼️ HILLCREST serisi için özel görsel atanıyor...');

  const hillcrestBarcodes = [
    '198739847109',
    '198739847116',
    '198739847123',
    '198739847055',
    '198739847062',
    '198739847079',
    '198739847086',
    '198739847093'
  ];

  // HILLCREST serisi için özel görsel (açık gri spor ayakkabısı)
  const hillcrestImage = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&crop=center';

  console.log('\n📦 HILLCREST 2.0 serisi güncelleniyor...');
  
  let updatedCount = 0;
  let notFoundCount = 0;

  for (const barcode of hillcrestBarcodes) {
    const product = await prisma.product.findUnique({
      where: { sku: barcode }
    });

    if (product) {
      await prisma.product.update({
        where: { id: product.id },
        data: { 
          imageUrl: hillcrestImage,
          description: `Açık gri spor ayakkabısı - ${product.name}`
        }
      });
      console.log(`✅ ${product.name} - Açık gri spor görseli`);
      updatedCount++;
    } else {
      console.log(`❌ Barkod bulunamadı: ${barcode}`);
      notFoundCount++;
    }
  }

  // Güncellenen ürünleri kontrol et
  const updatedProducts = await prisma.product.findMany({
    where: {
      sku: {
        in: hillcrestBarcodes
      }
    },
    select: { sku: true, name: true, imageUrl: true }
  });

  console.log(`\n📊 Özet:`);
  console.log(`✅ Güncellenen: ${updatedCount} ürün`);
  console.log(`❌ Bulunamayan: ${notFoundCount} ürün`);
  console.log(`📦 Toplam HILLCREST ürünü: ${updatedProducts.length}`);
  
  console.log(`\n📈 Güncellenen ürünler:`);
  updatedProducts.forEach(product => {
    console.log(`   ${product.sku} → Açık gri spor ayakkabısı`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
