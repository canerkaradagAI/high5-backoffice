const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugTaskDefinitions() {
  try {
    console.log('🔍 Debug: TaskDefinition verilerini kontrol ediyorum...');
    
    // Tüm görev tanımlarını al
    const taskDefinitions = await prisma.taskDefinition.findMany({
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' }
      ]
    });
    
    console.log('📊 Toplam görev tanımı sayısı:', taskDefinitions.length);
    
    // Her görev tanımını detaylı göster
    taskDefinitions.forEach((td, index) => {
      console.log(`\n${index + 1}. ${td.name}`);
      console.log(`   - ID: ${td.id}`);
      console.log(`   - Rol: ${td.role}`);
      console.log(`   - Aktif: ${td.isActive}`);
      console.log(`   - Ürün Kodu Gerekli: ${td.requiresProductCode}`);
      console.log(`   - Açıklama: ${td.description || 'Yok'}`);
      console.log(`   - Oluşturan: ${td.createdBy?.firstName} ${td.createdBy?.lastName}`);
      console.log(`   - Oluşturulma: ${td.createdAt}`);
    });
    
    // Özellikle "Müşteriye Ürün Getir" görevini kontrol et
    const specificTask = await prisma.taskDefinition.findUnique({
      where: {
        name_role: {
          name: 'Müşteriye Ürün Getir',
          role: 'Runner'
        }
      }
    });
    
    if (specificTask) {
      console.log('\n✅ "Müşteriye Ürün Getir" görev tanımı mevcut:');
      console.log('   - ID:', specificTask.id);
      console.log('   - Aktif:', specificTask.isActive);
    } else {
      console.log('\n❌ "Müşteriye Ürün Getir" görev tanımı bulunamadı!');
    }
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
    console.error('Detay:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTaskDefinitions();
