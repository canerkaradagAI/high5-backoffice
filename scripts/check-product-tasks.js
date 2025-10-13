const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProductTasks() {
  console.log('🔍 Ürün Getir Görevleri kontrol ediliyor...');

  try {
    const tasks = await prisma.task.findMany({
      where: { 
        type: { in: ['customer_product_delivery', 'customer_cabin_delivery'] } 
      },
      select: { 
        id: true, 
        title: true, 
        type: true, 
        productCode: true, 
        assignedToId: true,
        status: true
      }
    });
    
    console.log('\n📋 Ürün Getir Görevleri:');
    tasks.forEach(t => {
      console.log(`- ${t.title} (${t.type})`);
      console.log(`  ProductCode: ${t.productCode || 'YOK'}`);
      console.log(`  Assigned: ${t.assignedToId || 'YOK'}`);
      console.log(`  Status: ${t.status}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductTasks();
