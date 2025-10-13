const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getBarcodeList() {
  console.log('📦 Barkod listesi getiriliyor...');

  try {
    const products = await prisma.product.findMany({
      where: { brand: 'Skechers' },
      select: { sku: true, name: true },
      take: 20
    });
    
    console.log('\n📋 Barkod Listesi:');
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.sku} - ${product.name}`);
    });
    
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getBarcodeList();
