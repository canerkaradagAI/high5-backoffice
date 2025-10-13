const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateImageUrlsToHtml() {
  console.log('🖼️ Görsel URL\'leri HTML formatına güncelleniyor...');

  try {
    const products = await prisma.product.findMany({
      where: { brand: 'Skechers' }
    });
    
    console.log(`📦 ${products.length} ürün bulundu`);
    
    let updated = 0;
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const imageIndex = i % 5;
      const imageUrl = `/shoes/shoe${imageIndex + 1}-${['brown-slip-on', 'black-trail', 'blue-all-terrain', 'gray-slip-ins', 'dark-gray-athletic'][imageIndex]}.html`;
      
      try {
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: imageUrl }
        });
        
        updated++;
        console.log(`✅ Güncellendi: ${product.name} → ${imageUrl}`);
        
      } catch (error) {
        console.error(`❌ Hata: ${product.name} - ${error.message}`);
      }
    }
    
    console.log(`\n📊 Özet:`);
    console.log(`🖼️ Güncellenen: ${updated} ürün`);
    
  } catch (error) {
    console.error('❌ Genel hata:', error);
  }
}

updateImageUrlsToHtml()
  .catch((error) => {
    console.error('❌ Script hatası:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
