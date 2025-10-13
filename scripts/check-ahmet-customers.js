const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAhmetCustomers() {
  console.log('🔍 Ahmet Yılmaz müşteri sayısı kontrol ediliyor...');

  try {
    // Ahmet Yılmaz'ı bul
    const ahmet = await prisma.user.findFirst({
      where: { firstName: 'Ahmet', lastName: 'Yılmaz' }
    });

    if (!ahmet) {
      console.log('❌ Ahmet Yılmaz bulunamadı');
      return;
    }

    const customerCount = await prisma.customer.count({
      where: { assignedConsultantId: ahmet.id }
    });

    console.log(`\n👤 Ahmet Yılmaz'ın müşteri sayısı: ${customerCount}`);
    
    // Müşterileri listele
    const customers = await prisma.customer.findMany({
      where: { assignedConsultantId: ahmet.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true
      }
    });

    console.log('\n📋 Atanmış Müşteriler:');
    customers.forEach(c => {
      console.log(`- ${c.fullName} (${c.id})`);
    });

    // Parametreyi kontrol et
    const param = await prisma.parameter.findFirst({
      where: { key: 'max_customers_per_consultant' }
    });

    console.log(`\n📊 Limit: ${param?.value || 'Tanımsız'}`);
    console.log(`📊 Durum: ${customerCount}/${param?.value || 'Tanımsız'}`);

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAhmetCustomers();
