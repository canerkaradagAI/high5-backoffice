const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCreateTaskDefinition() {
  try {
    console.log('🧪 Görev tanımı oluşturma testi...');
    
    // Önce mevcut görevleri kontrol et
    const existingTask = await prisma.taskDefinition.findUnique({
      where: {
        name_role: {
          name: 'Müşteriye Ürün Getir',
          role: 'Runner'
        }
      }
    });
    
    if (existingTask) {
      console.log('⚠️ Bu görev tanımı zaten mevcut:', existingTask.id);
      return;
    }
    
    // Test için yeni bir görev tanımı oluştur
    const testTask = await prisma.taskDefinition.create({
      data: {
        name: 'Test Görev',
        description: 'Test açıklaması',
        role: 'Runner',
        requiresProductCode: true,
        createdById: 'test-user-id' // Bu geçerli bir user ID olmalı
      }
    });
    
    console.log('✅ Test görev tanımı oluşturuldu:', testTask.id);
    
    // Test görevini sil
    await prisma.taskDefinition.delete({
      where: { id: testTask.id }
    });
    
    console.log('🗑️ Test görev tanımı silindi');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
    console.error('Detay:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCreateTaskDefinition();
