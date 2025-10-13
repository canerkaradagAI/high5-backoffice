const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateAllImagesToSingleShoe() {
  console.log('🖼️ Tüm ürünlerin görseli tek ayakkabı görseline güncelleniyor...');

  try {
    const products = await prisma.product.findMany({
      where: { brand: 'Skechers' }
    });
    
    console.log(`📦 ${products.length} ürün bulundu`);
    
    let updated = 0;
    
    for (const product of products) {
      try {
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: '/shoes/shoe.jpg' }
        });
        
        updated++;
        console.log(`✅ Güncellendi: ${product.name}`);
        
      } catch (error) {
        console.error(`❌ Hata: ${product.name} - ${error.message}`);
      }
    }
    
    console.log(`\n📊 Özet:`);
    console.log(`🖼️ Güncellenen: ${updated} ürün`);
    console.log(`👟 Tüm ürünler artık aynı siyah trail ayakkabısı görselini kullanıyor!`);
    
  } catch (error) {
    console.error('❌ Genel hata:', error);
  }
}

updateAllImagesToSingleShoe()
  .catch((error) => {
    console.error('❌ Script hatası:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
