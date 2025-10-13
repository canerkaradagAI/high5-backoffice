const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateProductImages() {
  console.log('🖼️ Ürün görselleri yeni ayakkabı görselleriyle güncelleniyor...');

  // Yeni ayakkabı görselleri
  const shoeImages = [
    '/shoes/shoe1-brown-slip-on.jpg',    // Kahverengi slip-on
    '/shoes/shoe2-black-trail.jpg',       // Siyah trail ayakkabısı
    '/shoes/shoe3-blue-all-terrain.jpg',  // Mavi all-terrain
    '/shoes/shoe4-gray-slip-ins.jpg',     // Gri slip-ins
    '/shoes/shoe5-dark-gray-athletic.jpg' // Koyu gri atletik
  ];

  try {
    // Tüm Skechers ürünlerini getir
    const products = await prisma.product.findMany({
      where: {
        brand: 'Skechers'
      }
    });
    
    console.log(`📦 ${products.length} Skechers ürünü bulundu`);
    
    let updated = 0;
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      // Ürünleri döngüsel olarak görsellerle eşleştir
      const imageIndex = i % shoeImages.length;
      const imageUrl = shoeImages[imageIndex];
      
      try {
        await prisma.product.update({
          where: { id: product.id },
          data: { 
            imageUrl: imageUrl,
            description: `${product.name} - Skechers ayakkabısı`
          }
        });
        
        updated++;
        console.log(`✅ Güncellendi: ${product.name} → ${imageUrl}`);
        
      } catch (error) {
        console.error(`❌ Hata: ${product.name} - ${error.message}`);
      }
    }
    
    console.log(`\n📊 Özet:`);
    console.log(`🖼️ Güncellenen: ${updated} ürün`);
    console.log(`📦 Toplam Skechers ürünü: ${products.length}`);
    
    // Güncellenen ürünleri kontrol et
    const updatedProducts = await prisma.product.findMany({
      where: {
        brand: 'Skechers',
        imageUrl: {
          startsWith: '/shoes/'
        }
      },
      select: {
        name: true,
        imageUrl: true
      }
    });
    
    console.log(`\n📈 Yeni görsellerle güncellenen ürünler:`);
    updatedProducts.forEach(product => {
      console.log(`   ${product.name} → ${product.imageUrl}`);
    });
    
  } catch (error) {
    console.error('❌ Genel hata:', error);
  }
}

updateProductImages()
  .catch((error) => {
    console.error('❌ Script hatası:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
