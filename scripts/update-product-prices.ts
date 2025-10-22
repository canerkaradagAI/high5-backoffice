import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateProductPrices() {
  try {
    console.log('💰 Ürün fiyatları güncelleniyor...');
    
    // Tüm ürünleri getir
    const products = await prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        name: true,
        price: true
      }
    });
    
    console.log(`📊 Toplam ${products.length} ürün bulundu`);
    
    let updatedCount = 0;
    
    for (const product of products) {
      // 5999 ile 8999 arasında rastgele fiyat oluştur
      const minPrice = 5999;
      const maxPrice = 8999;
      const randomPrice = Math.floor(Math.random() * (maxPrice - minPrice + 1)) + minPrice;
      
      await prisma.product.update({
        where: { id: product.id },
        data: { price: randomPrice }
      });
      
      updatedCount++;
      
      // Her 100 üründe bir progress göster
      if (updatedCount % 100 === 0) {
        console.log(`📈 Güncellenen: ${updatedCount}/${products.length}`);
      }
    }
    
    console.log('\n✅ Fiyat güncelleme işlemi tamamlandı!');
    console.log(`💰 ${updatedCount} ürünün fiyatı güncellendi`);
    console.log(`📊 Fiyat aralığı: 5999 - 8999 TL`);
    
    // Örnek fiyatları göster
    const sampleProducts = await prisma.product.findMany({
      take: 5,
      select: {
        sku: true,
        name: true,
        price: true
      }
    });
    
    console.log('\n📋 Örnek ürünler:');
    sampleProducts.forEach(product => {
      console.log(`   • ${product.sku} - ${product.name}: ${product.price} TL`);
    });
    
  } catch (error) {
    console.error('❌ Fiyat güncelleme işleminde hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Script'i çalıştır
updateProductPrices();
