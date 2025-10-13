const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Ürün kategorilerine göre placeholder görseller
const imageMap = {
  'GO WALK FLEX RAY': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center',
  'GO WALK 8 PATE': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center',
  'EQUALIZER 5.0 TRAIL TUMBLER RIDGE': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center',
  'HILLCREST 2.0': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center'
};

async function addProductImages() {
  console.log('🖼️ Ürün görselleri ekleniyor...');
  
  let updated = 0;
  
  try {
    // Tüm Skechers ürünlerini getir
    const products = await prisma.product.findMany({
      where: {
        brand: 'Skechers',
        imageUrl: null // Sadece görseli olmayan ürünleri güncelle
      }
    });
    
    console.log(`📦 ${products.length} ürün bulundu`);
    
    for (const product of products) {
      try {
        // Ürün adından modeli çıkar
        const modelName = product.name.split(' - ')[0];
        const imageUrl = imageMap[modelName] || 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center';
        
        // Ürünü güncelle
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: imageUrl }
        });
        
        updated++;
        console.log(`✅ Görsel eklendi: ${product.name}`);
        
      } catch (error) {
        console.error(`❌ Hata: ${product.name} - ${error}`);
      }
    }
    
    console.log(`\n📊 Özet:`);
    console.log(`🖼️ Güncellenen: ${updated} ürün`);
    
  } catch (error) {
    console.error('❌ Genel hata:', error);
  }
}

addProductImages()
  .catch((error) => {
    console.error('❌ Script hatası:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Veritabanı bağlantısı kapatıldı');
  });
