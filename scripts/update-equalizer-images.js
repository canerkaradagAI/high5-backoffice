const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🖼️ EQUALIZER serisi için özel görsel atanıyor...');

  const equalizerBarcodes = [
    '198739931709',
    '198739931716',
    '198739931723',
    '198739931655',
    '198739931662',
    '198739931679',
    '198739931686',
    '198739931693'
  ];

  // EQUALIZER serisi için özel görsel (siyah trail ayakkabısı)
  const equalizerImage = 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop&crop=center';

  console.log('\n📦 EQUALIZER 5.0 TRAIL TUMBLER RIDGE serisi güncelleniyor...');
  
  let updatedCount = 0;
  let notFoundCount = 0;

  for (const barcode of equalizerBarcodes) {
    const product = await prisma.product.findUnique({
      where: { sku: barcode }
    });

    if (product) {
      await prisma.product.update({
        where: { id: product.id },
        data: { 
          imageUrl: equalizerImage,
          description: `Siyah trail ayakkabısı - ${product.name}`
        }
      });
      console.log(`✅ ${product.name} - Siyah trail görseli`);
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
        in: equalizerBarcodes
      }
    },
    select: { sku: true, name: true, imageUrl: true }
  });

  console.log(`\n📊 Özet:`);
  console.log(`✅ Güncellenen: ${updatedCount} ürün`);
  console.log(`❌ Bulunamayan: ${notFoundCount} ürün`);
  console.log(`📦 Toplam EQUALIZER ürünü: ${updatedProducts.length}`);
  
  console.log(`\n📈 Güncellenen ürünler:`);
  updatedProducts.forEach(product => {
    console.log(`   ${product.sku} → Siyah trail ayakkabısı`);
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
