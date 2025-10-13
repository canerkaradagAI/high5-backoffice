const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addSalesConsultant() {
  console.log('👤 Yeni satış danışmanı ekleniyor...');

  try {
    // Satış Danışmanı rolünü bul
    const salesConsultantRole = await prisma.role.findFirst({
      where: { name: 'Satış Danışmanı' }
    });

    if (!salesConsultantRole) {
      console.error('❌ Satış Danışmanı rolü bulunamadı!');
      return;
    }

    // Özge Aslan'ı oluştur
    const ozgeAslan = await prisma.user.create({
      data: {
        firstName: 'Özge',
        lastName: 'Aslan',
        email: 'ozge.aslan@high5.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        phone: '+90 555 123 4567',
        isActive: true,
        userRoles: {
          create: {
            roleId: salesConsultantRole.id,
            isActive: true,
            assignedAt: new Date(),
            assignedBy: 'system'
          }
        }
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    console.log('✅ Özge Aslan başarıyla eklendi:');
    console.log(`- ID: ${ozgeAslan.id}`);
    console.log(`- Ad: ${ozgeAslan.firstName} ${ozgeAslan.lastName}`);
    console.log(`- Email: ${ozgeAslan.email}`);
    console.log(`- Telefon: ${ozgeAslan.phone}`);
    console.log(`- Aktif: ${ozgeAslan.isActive}`);
    console.log(`- Roller: ${ozgeAslan.userRoles.map(ur => ur.role.name).join(', ')}`);

    // Şimdi tüm satış danışmanlarını kontrol et
    const allConsultants = await prisma.user.findMany({
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

    console.log(`\n📊 Toplam Satış Danışmanı Sayısı: ${allConsultants.length}`);
    console.log('\n👥 Tüm Satış Danışmanları:');
    allConsultants.forEach((consultant, index) => {
      const customerCount = consultant.consultingCustomers.length;
      console.log(`${index + 1}. ${consultant.firstName} ${consultant.lastName} - ${customerCount} müşteri`);
    });

  } catch (error) {
    console.error('❌ Satış danışmanı eklenirken hata oluştu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSalesConsultant();
