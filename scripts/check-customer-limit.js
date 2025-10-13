const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCustomerLimit() {
  console.log('🔍 Müşteri limiti parametresi kontrol ediliyor...');

  try {
    // Parametreyi kontrol et
    const param = await prisma.parameter.findFirst({
      where: { key: 'max_customers_per_consultant' }
    });

    console.log('\n📋 Müşteri Limiti Parametresi:');
    if (!param) {
      console.log('❌ Parametre bulunamadı!');
    } else {
      console.log(`- Key: ${param.key}`);
      console.log(`- Value: ${param.value}`);
      console.log(`- Active: ${param.isActive}`);
    }

    // Ayşe Kaya'nın müşteri sayısını kontrol et
    const user = await prisma.user.findFirst({
      where: { firstName: 'Ayşe', lastName: 'Kaya' }
    });

    if (user) {
      const customerCount = await prisma.customer.count({
        where: { assignedConsultantId: user.id }
      });

      console.log(`\n👤 Ayşe Kaya'nın müşteri sayısı: ${customerCount}`);
      
      // Müşterileri listele
      const customers = await prisma.customer.findMany({
        where: { assignedConsultantId: user.id },
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
    }

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCustomerLimit();
