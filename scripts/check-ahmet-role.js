const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAhmetRole() {
  console.log('🔍 Ahmet Yılmaz rolü kontrol ediliyor...');

  try {
    // Ahmet Yılmaz'ı bul
    const ahmet = await prisma.user.findFirst({
      where: { firstName: 'Ahmet', lastName: 'Yılmaz' },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!ahmet) {
      console.log('❌ Ahmet Yılmaz bulunamadı');
      return;
    }

    console.log(`\n👤 ${ahmet.firstName} ${ahmet.lastName}:`);
    console.log(`- ID: ${ahmet.id}`);
    console.log(`- Aktif: ${ahmet.isActive}`);
    console.log(`- Roller:`);
    
    ahmet.userRoles.forEach(userRole => {
      console.log(`  - ${userRole.role.name} (Aktif: ${userRole.isActive})`);
    });

    // Müşteri sayısını kontrol et
    const customerCount = await prisma.customer.count({
      where: { assignedConsultantId: ahmet.id }
    });

    console.log(`\n📊 Müşteri Sayısı: ${customerCount}`);

    // Eğer satış danışmanı değilse müşteri atanamamalı
    const isSalesConsultant = ahmet.userRoles.some(ur => 
      ur.role.name === 'Satış Danışmanı' && ur.isActive
    );

    console.log(`\n🎯 Satış Danışmanı mı: ${isSalesConsultant ? 'Evet' : 'Hayır'}`);

    if (!isSalesConsultant) {
      console.log('❌ Ahmet Yılmaz satış danışmanı değil! Müşteri atanamamalı.');
    }

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAhmetRole();
