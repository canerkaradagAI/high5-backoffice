const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateAllToSvg() {
  console.log('🖼️ Tüm görseller SVG formatına güncelleniyor...');

  try {
    // Ürün tablosunu güncelle
    const products = await prisma.product.findMany({
      where: { brand: 'Skechers' }
    });
    
    console.log(`📦 ${products.length} ürün bulundu`);
    
    let updatedProducts = 0;
    for (const product of products) {
      try {
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: '/shoes/shoe.svg' }
        });
        updatedProducts++;
      } catch (error) {
        console.error(`❌ Ürün hatası: ${product.name} - ${error.message}`);
      }
    }
    
    // Sepet tablosunu güncelle
    const cartItems = await prisma.cartItem.findMany();
    
    console.log(`🛒 ${cartItems.length} sepet öğesi bulundu`);
    
    let updatedCartItems = 0;
    for (const item of cartItems) {
      try {
        await prisma.cartItem.update({
          where: { id: item.id },
          data: { imageUrl: '/shoes/shoe.svg' }
        });
        updatedCartItems++;
      } catch (error) {
        console.error(`❌ Sepet hatası: ${item.title} - ${error.message}`);
      }
    }
    
    console.log(`\n📊 Özet:`);
    console.log(`📦 Güncellenen ürün: ${updatedProducts}`);
    console.log(`🛒 Güncellenen sepet öğesi: ${updatedCartItems}`);
    console.log(`👟 Tüm görseller artık SVG formatında!`);
    
  } catch (error) {
    console.error('❌ Genel hata:', error);
  }
}

updateAllToSvg()
  .catch((error) => {
    console.error('❌ Script hatası:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
