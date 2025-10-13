const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTaskDefinitions() {
  try {
    console.log('🔍 TaskDefinition tablosu kontrol ediliyor...');
    
    const taskDefinitions = await prisma.taskDefinition.findMany();
    console.log('📊 Bulunan görev tanımları:', taskDefinitions.length);
    
    if (taskDefinitions.length > 0) {
      console.log('\n📋 Görev Tanımları:');
      taskDefinitions.forEach((td, index) => {
        console.log(`${index + 1}. ${td.name} (${td.role}) - Aktif: ${td.isActive} - Ürün Kodu: ${td.requiresProductCode}`);
      });
    } else {
      console.log('❌ Hiç görev tanımı bulunamadı!');
    }
    
    // Tablo yapısını kontrol et
    console.log('\n🔧 Tablo yapısı kontrol ediliyor...');
    const tableInfo = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name='TaskDefinition'`;
    console.log('TaskDefinition tablosu var mı?', tableInfo.length > 0 ? '✅ Evet' : '❌ Hayır');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTaskDefinitions();
