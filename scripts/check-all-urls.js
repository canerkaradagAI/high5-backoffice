const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllImageUrls() {
  console.log('🔍 Tüm görsel URL\'leri kontrol ediliyor...');

  try {
    // Ürün tablosunu kontrol et
    const products = await prisma.product.findMany({
      where: { brand: 'Skechers' },
      select: { name: true, imageUrl: true },
      take: 5
    });
    
    console.log('\n📦 Ürün tablosu:');
    products.forEach(p => console.log(`${p.name} → ${p.imageUrl}`));
    
    // Sepet tablosunu kontrol et
    const cartItems = await prisma.cartItem.findMany({
      select: { title: true, imageUrl: true },
      take: 5
    });
    
    console.log('\n🛒 Sepet tablosu:');
    cartItems.forEach(item => console.log(`${item.title} → ${item.imageUrl}`));
    
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllImageUrls();