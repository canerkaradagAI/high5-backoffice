const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function reassignCustomers() {
  console.log('🔄 Müşteriler yeniden atanıyor...');

  try {
    // Ayşe Kaya'yı bul
    const ayse = await prisma.user.findFirst({
      where: { firstName: 'Ayşe', lastName: 'Kaya' }
    });

    if (!ayse) {
      console.log('❌ Ayşe Kaya bulunamadı');
      return;
    }

    // Başka bir danışman bul (Ahmet Yılmaz)
    const ahmet = await prisma.user.findFirst({
      where: { firstName: 'Ahmet', lastName: 'Yılmaz' }
    });

    if (!ahmet) {
      console.log('❌ Ahmet Yılmaz bulunamadı');
      return;
    }

    // Ayşe'nin müşterilerini al
    const customers = await prisma.customer.findMany({
      where: { assignedConsultantId: ayse.id },
      take: 2 // İlk 2 müşteriyi al
    });

    console.log(`📋 ${customers.length} müşteri Ahmet'e atanıyor...`);

    // İlk 2 müşteriyi Ahmet'e ata
    for (const customer of customers) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { assignedConsultantId: ahmet.id }
      });
      console.log(`✅ ${customer.fullName} → Ahmet Yılmaz`);
    }

    // Sonuçları kontrol et
    const ayseCount = await prisma.customer.count({
      where: { assignedConsultantId: ayse.id }
    });

    const ahmetCount = await prisma.customer.count({
      where: { assignedConsultantId: ahmet.id }
    });

    console.log(`\n📊 Sonuç:`);
    console.log(`- Ayşe Kaya: ${ayseCount} müşteri`);
    console.log(`- Ahmet Yılmaz: ${ahmetCount} müşteri`);

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reassignCustomers();
