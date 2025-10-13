const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSalesConsultants() {
  console.log('🔍 Satış danışmanları kontrol ediliyor...');

  try {
    // Tüm satış danışmanlarını bul
    const consultants = await prisma.user.findMany({
      where: {
        isActive: true,
        userRoles: {
          some: {
            role: {
              name: 'Satış Danışmanı'
            },
            isActive: true
          }
        }
      },
      include: {
        consultingCustomers: {
          select: { id: true }
        }
      }
    });

    console.log(`\n📊 Toplam Satış Danışmanı Sayısı: ${consultants.length}`);
    
    console.log('\n👥 Satış Danışmanları:');
    consultants.forEach((consultant, index) => {
      const customerCount = consultant.consultingCustomers.length;
      console.log(`${index + 1}. ${consultant.firstName} ${consultant.lastName} - ${customerCount} müşteri`);
    });

    // Parametreyi kontrol et
    const param = await prisma.parameter.findFirst({
      where: { key: 'max_customers_per_consultant' }
    });

    console.log(`\n📋 Limit Parametresi:`);
    console.log(`- Key: ${param?.key || 'Bulunamadı'}`);
    console.log(`- Value: ${param?.value || 'Tanımsız'}`);
    console.log(`- Active: ${param?.isActive || false}`);

    // Boşta danışmanları bul
    const MAX_CUSTOMERS = param ? parseInt(param.value) : 1;
    const availableConsultants = consultants.filter(c => 
      c.consultingCustomers.length < MAX_CUSTOMERS
    );

    console.log(`\n🎯 Boşta Danışman Sayısı: ${availableConsultants.length}`);
    if (availableConsultants.length > 0) {
      console.log('📋 Boşta Danışmanlar:');
      availableConsultants.forEach(c => {
        console.log(`- ${c.firstName} ${c.lastName}: ${c.consultingCustomers.length}/${MAX_CUSTOMERS}`);
      });
    } else {
      console.log('❌ Boşta danışman yok - tüm danışmanlar limit dolu');
    }

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSalesConsultants();
