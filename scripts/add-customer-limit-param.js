const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addCustomerLimitParameter() {
  console.log('🔧 Müşteri limiti parametresi ekleniyor...');

  try {
    // Parametreyi ekle
    const param = await prisma.parameter.create({
      data: {
        key: 'max_customers_per_consultant',
        value: '2',
        type: 'number',
        description: 'Satış danışmanı başına maksimum müşteri sayısı',
        category: 'customer',
        isActive: true
      }
    });

    console.log('✅ Parametre eklendi:');
    console.log(`- Key: ${param.key}`);
    console.log(`- Value: ${param.value}`);
    console.log(`- Type: ${param.type}`);
    console.log(`- Active: ${param.isActive}`);

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addCustomerLimitParameter();
