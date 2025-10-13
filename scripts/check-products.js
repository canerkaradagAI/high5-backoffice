const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProducts() {
  console.log('🔍 Veritabanındaki ürünler kontrol ediliyor...');

  try {
    const products = await prisma.product.findMany({
      select: {
        sku: true,
        name: true,
        isActive: true
      },
      take: 10
    });

    console.log('\n📋 Veritabanındaki ürünler:');
    if (products.length === 0) {
      console.log('Henüz ürün bulunmamaktadır.');
    } else {
      products.forEach(p => {
        console.log(`- ${p.sku}: ${p.name} (Active: ${p.isActive})`);
      });
    }

    // Örnek barkodları test et
    console.log('\n🧪 Örnek barkodları test ediliyor...');
    const testBarcodes = ['8683030770925', '198739626223', '198739931709'];
    
    for (const barcode of testBarcodes) {
      const product = await prisma.product.findFirst({
        where: {
          sku: barcode,
          isActive: true
        }
      });
      
      if (product) {
        console.log(`✅ ${barcode}: ${product.name} - BULUNDU`);
      } else {
        console.log(`❌ ${barcode}: BULUNAMADI`);
      }
    }

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();