const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAhmetCustomers() {
  console.log('🔧 Ahmet Yılmaz müşteri sayısı düzeltiliyor...');

  try {
    // Ahmet Yılmaz'ı bul
    const ahmet = await prisma.user.findFirst({
      where: { firstName: 'Ahmet', lastName: 'Yılmaz' }
    });

    if (!ahmet) {
      console.log('❌ Ahmet Yılmaz bulunamadı');
      return;
    }

    // Ahmet'in müşterilerini al
    const customers = await prisma.customer.findMany({
      where: { assignedConsultantId: ahmet.id },
      take: 1 // İlk müşteriyi al
    });

    console.log(`📋 ${customers.length} müşteri kaldırılıyor...`);

    // İlk müşteriyi kaldır (null yap)
    for (const customer of customers) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { assignedConsultantId: null }
      });
      console.log(`✅ ${customer.fullName} → Atanmamış`);
    }

    // Sonuçları kontrol et
    const ahmetCount = await prisma.customer.count({
      where: { assignedConsultantId: ahmet.id }
    });

    console.log(`\n📊 Sonuç:`);
    console.log(`- Ahmet Yılmaz: ${ahmetCount} müşteri`);

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAhmetCustomers();
