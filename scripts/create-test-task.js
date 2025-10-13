const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestTask() {
  console.log('🧪 Test ürün getirme görevi oluşturuluyor...');

  try {
    // Önce Runner kullanıcısını bul
    const runner = await prisma.user.findFirst({
      where: { email: 'runner@olka.com' }
    });

    if (!runner) {
      console.log('❌ Runner kullanıcısı bulunamadı');
      return;
    }

    // Test görevi oluştur
    const task = await prisma.task.create({
      data: {
        title: 'Müşteriye Ürün Getir',
        description: 'Test ürün getirme görevi',
        type: 'customer_product_delivery',
        priority: 'medium',
        status: 'ASSIGNED',
        productCode: '198739626223 - Skechers Equalizer 4.0 - 9',
        deliveryLocation: 'SD Teslim',
        targetRole: 'Runner',
        assignedToId: runner.id,
        createdById: runner.id, // Geçici olarak runner kendisi oluşturuyor
        customerId: null // Müşteri olmadan test
      }
    });

    console.log('✅ Test görevi oluşturuldu:');
    console.log(`- ID: ${task.id}`);
    console.log(`- Title: ${task.title}`);
    console.log(`- ProductCode: ${task.productCode}`);
    console.log(`- AssignedTo: ${task.assignedToId}`);
    
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestTask();
