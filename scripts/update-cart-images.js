const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateCartItemImages() {
  console.log('🛒 Sepet öğelerinin görselleri güncelleniyor...');

  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { imageUrl: { not: '/shoes/shoe.jpg' } }
    });
    
    console.log(`📦 ${cartItems.length} sepet öğesi bulundu`);
    
    let updated = 0;
    
    for (const item of cartItems) {
      try {
        await prisma.cartItem.update({
          where: { id: item.id },
          data: { imageUrl: '/shoes/shoe.jpg' }
        });
        
        updated++;
        console.log(`✅ Güncellendi: ${item.title}`);
        
      } catch (error) {
        console.error(`❌ Hata: ${item.title} - ${error.message}`);
      }
    }
    
    console.log(`\n📊 Özet:`);
    console.log(`🛒 Güncellenen sepet öğesi: ${updated}`);
    
  } catch (error) {
    console.error('❌ Genel hata:', error);
  }
}

updateCartItemImages()
  .catch((error) => {
    console.error('❌ Script hatası:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
