
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create roles
  const salesConsultantRole = await prisma.role.upsert({
    where: { name: 'Satış Danışmanı' },
    update: {},
    create: {
      name: 'Satış Danışmanı',
      description: 'Müşteri hizmetleri ve satış işlemlerinden sorumlu rol'
    }
  });

  const runnerRole = await prisma.role.upsert({
    where: { name: 'Runner' },
    update: {},
    create: {
      name: 'Runner',
      description: 'Görev takip ve operasyonel işlemlerden sorumlu rol'
    }
  });

  const storeManagerRole = await prisma.role.upsert({
    where: { name: 'Mağaza Müdürü' },
    update: {},
    create: {
      name: 'Mağaza Müdürü',
      description: 'Mağaza yönetimi ve tüm süreçlerden sorumlu rol'
    }
  });

  // Create permissions
  const permissions = [
    { name: 'Müşteri Görüntüleme', description: 'Müşteri bilgilerini görüntüleme yetkisi' },
    { name: 'Müşteri Ekleme', description: 'Yeni müşteri ekleme yetkisi' },
    { name: 'Müşteri Düzenleme', description: 'Müşteri bilgilerini düzenleme yetkisi' },
    { name: 'Görev Görüntüleme', description: 'Görevleri görüntüleme yetkisi' },
    { name: 'Görev Alma', description: 'Görev alma yetkisi' },
    { name: 'Görev Atama', description: 'Görev atama yetkisi' },
    { name: 'Görev Oluşturma', description: 'Yeni görev oluşturma yetkisi' },
    { name: 'Kullanıcı Yönetimi', description: 'Kullanıcı ekleme/düzenleme yetkisi' },
    { name: 'Rol Yönetimi', description: 'Rol ve yetki yönetimi' },
    { name: 'Parametre Düzenleme', description: 'Sistem parametrelerini düzenleme yetkisi' },
    { name: 'Rapor Görüntüleme', description: 'Raporları görüntüleme yetkisi' }
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission
    });
  }

  // Get created permissions
  const allPermissions = await prisma.permission.findMany();
  
  // Assign permissions to roles
  // Sales Consultant permissions
  const salesConsultantPermissions = [
    'Müşteri Görüntüleme', 'Müşteri Ekleme', 'Görev Görüntüleme', 'Görev Alma'
  ];
  for (const permName of salesConsultantPermissions) {
    const permission = allPermissions.find(p => p.name === permName);
    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: salesConsultantRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: salesConsultantRole.id,
          permissionId: permission.id
        }
      });
    }
  }

  // Runner permissions
  const runnerPermissions = [
    'Görev Görüntüleme', 'Görev Alma', 'Müşteri Görüntüleme'
  ];
  for (const permName of runnerPermissions) {
    const permission = allPermissions.find(p => p.name === permName);
    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: runnerRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: runnerRole.id,
          permissionId: permission.id
        }
      });
    }
  }

  // Store Manager permissions (all permissions)
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: storeManagerRole.id,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        roleId: storeManagerRole.id,
        permissionId: permission.id
      }
    });
  }

  // Create test users
  const hashedPassword = await bcrypt.hash('123456', 12);

  // Test account (required by system)
  const testUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      password: await bcrypt.hash('johndoe123', 12),
      firstName: 'John',
      lastName: 'Doe',
      name: 'John Doe',
      phone: '5551234567'
    }
  });

  // Store Manager
  const storeManager = await prisma.user.upsert({
    where: { email: 'mudur@olka.com' },
    update: {},
    create: {
      email: 'mudur@olka.com',
      password: hashedPassword,
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      name: 'Ahmet Yılmaz',
      phone: '5551234568'
    }
  });

  // Sales Consultant
  const salesConsultant = await prisma.user.upsert({
    where: { email: 'satis@olka.com' },
    update: {},
    create: {
      email: 'satis@olka.com',
      password: hashedPassword,
      firstName: 'Ayşe',
      lastName: 'Kaya',
      name: 'Ayşe Kaya',
      phone: '5551234569'
    }
  });

  // Runner
  const runner = await prisma.user.upsert({
    where: { email: 'runner@olka.com' },
    update: {},
    create: {
      email: 'runner@olka.com',
      password: hashedPassword,
      firstName: 'Mehmet',
      lastName: 'Demir',
      name: 'Mehmet Demir',
      phone: '5551234570'
    }
  });

  // Assign roles to users
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: testUser.id,
        roleId: storeManagerRole.id
      }
    },
    update: {},
    create: {
      userId: testUser.id,
      roleId: storeManagerRole.id
    }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: storeManager.id,
        roleId: storeManagerRole.id
      }
    },
    update: {},
    create: {
      userId: storeManager.id,
      roleId: storeManagerRole.id
    }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: salesConsultant.id,
        roleId: salesConsultantRole.id
      }
    },
    update: {},
    create: {
      userId: salesConsultant.id,
      roleId: salesConsultantRole.id
    }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: runner.id,
        roleId: runnerRole.id
      }
    },
    update: {},
    create: {
      userId: runner.id,
      roleId: runnerRole.id
    }
  });

  // Create sample products
  const products = [
    {
      sku: '8683030770925',
      name: 'GO WALK FLEX RAY',
      description: 'Rahat yürüyüş ayakkabısı',
      price: 899.99,
      category: 'Ayakkabı',
      brand: 'Skechers',
      color: 'Siyah',
      size: '9',
      imageUrl: '/shoes/shoe.svg',
      isActive: true
    },
    {
      sku: '198739626223',
      name: 'GO WALK 8 PATE',
      description: 'Spor ayakkabı',
      price: 799.99,
      category: 'Ayakkabı',
      brand: 'Skechers',
      color: 'Mavi',
      size: '8',
      imageUrl: '/shoes/shoe.svg',
      isActive: true
    },
    {
      sku: '198739931709',
      name: 'EQUALIZER 5.0 TRAIL',
      description: 'Doğa yürüyüş ayakkabısı',
      price: 999.99,
      category: 'Ayakkabı',
      brand: 'Skechers',
      color: 'Kahverengi',
      size: '10',
      imageUrl: '/shoes/shoe.svg',
      isActive: true
    },
    {
      sku: '8683030780900',
      name: 'GO WALK FLEX RAY',
      description: 'Rahat yürüyüş ayakkabısı',
      price: 899.99,
      category: 'Ayakkabı',
      brand: 'Skechers',
      color: 'Gri',
      size: '7',
      imageUrl: '/shoes/shoe.svg',
      isActive: true
    },
    {
      sku: '198739626224',
      name: 'GO WALK 8 PATE',
      description: 'Spor ayakkabı',
      price: 799.99,
      category: 'Ayakkabı',
      brand: 'Skechers',
      color: 'Siyah',
      size: '9',
      imageUrl: '/shoes/shoe.svg',
      isActive: true
    },
    {
      sku: '198739931710',
      name: 'EQUALIZER 5.0 TRAIL',
      description: 'Doğa yürüyüş ayakkabısı',
      price: 999.99,
      category: 'Ayakkabı',
      brand: 'Skechers',
      color: 'Mavi',
      size: '8',
      imageUrl: '/shoes/shoe.svg',
      isActive: true
    }
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product
    });
  }

  // Create sample customers
  const customers = [
    {
      firstName: 'Fatma',
      lastName: 'Özkan',
      fullName: 'Fatma Özkan',
      phone: '5559876543',
      email: 'fatma@email.com',
      segment: 'VIP',
      totalSpent: 5000,
      totalOrders: 15,
      city: 'İstanbul'
    },
    {
      firstName: 'Can',
      lastName: 'Aktaş',
      fullName: 'Can Aktaş',
      phone: '5559876544',
      email: 'can@email.com',
      segment: 'Premium',
      totalSpent: 2500,
      totalOrders: 8,
      city: 'Ankara'
    },
    {
      firstName: 'Zehra',
      lastName: 'Çelik',
      fullName: 'Zehra Çelik',
      phone: '5559876545',
      segment: 'Aday',
      totalSpent: 800,
      totalOrders: 3,
      city: 'İzmir'
    },
    {
      firstName: 'Test',
      lastName: 'Müşteri',
      fullName: 'Test Müşteri',
      phone: '5559774634',
      segment: 'VIP',
      totalSpent: 10000,
      totalOrders: 25,
      city: 'İstanbul'
    },
    // Eski müşterileriniz
    {
      firstName: 'Emre',
      lastName: 'Keloğlu',
      fullName: 'Emre Keloğlu',
      phone: '5551234567',
      email: 'emre@email.com',
      segment: 'Premium',
      totalSpent: 3500,
      totalOrders: 12,
      city: 'İstanbul'
    },
    {
      firstName: 'Metin',
      lastName: 'Özcan',
      fullName: 'Metin Özcan',
      phone: '5551234568',
      email: 'metin@email.com',
      segment: 'Classic',
      totalSpent: 1800,
      totalOrders: 6,
      city: 'Ankara'
    },
    {
      firstName: 'Efe',
      lastName: 'Gözener',
      fullName: 'Efe Gözener',
      phone: '5551234569',
      email: 'efe@email.com',
      segment: 'VIP',
      totalSpent: 7500,
      totalOrders: 20,
      city: 'İzmir'
    },
    {
      firstName: 'Caner',
      lastName: 'KARADAĞ',
      fullName: 'Caner KARADAĞ',
      phone: '5551234570',
      email: 'caner@email.com',
      segment: 'Premium',
      totalSpent: 4200,
      totalOrders: 14,
      city: 'İstanbul'
    }
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { phone: customer.phone },
      update: {},
      create: customer
    });
  }

  // Create system parameters
  const parameters = [
    { key: 'MAX_CUSTOMER_PER_CONSULTANT', value: '50', type: 'NUMBER', description: 'Satış danışmanının bakabileceği maksimum müşteri sayısı', category: 'LIMITS' },
    { key: 'MAX_TASKS_PER_USER', value: '20', type: 'NUMBER', description: 'Kullanıcı başına maksimum görev sayısı', category: 'LIMITS' },
    { key: 'STORE_NAME', value: 'OLKA Premium Mağaza', type: 'STRING', description: 'Mağaza adı', category: 'SYSTEM' },
    { key: 'AUTO_TASK_ASSIGNMENT', value: 'true', type: 'BOOLEAN', description: 'Otomatik görev ataması aktif', category: 'SYSTEM' },
    { key: 'CUSTOMER_DRAG_BEHAVIOR', value: 'pool', type: 'STRING', description: 'Müşteri sürükleme davranışı: pool (havuza al) veya transfer (transfer et)', category: 'CUSTOMER' }
  ];

  for (const parameter of parameters) {
    await prisma.parameter.upsert({
      where: { key: parameter.key },
      update: {},
      create: parameter
    });
  }

  // Add sales history to customers
  console.log('🛍️ Müşterilere satış geçmişi ekleniyor...');
  
  const allCustomers = await prisma.customer.findMany({
    select: { id: true, firstName: true, lastName: true }
  });

  const allProducts = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, price: true, description: true, imageUrl: true }
  });

  for (const customer of allCustomers) {
    const salesCount = Math.floor(Math.random() * 5) + 1; // 1-5 arası
    
    for (let i = 0; i < salesCount; i++) {
      const randomProduct = allProducts[Math.floor(Math.random() * allProducts.length)];
      const randomDaysAgo = Math.floor(Math.random() * 180); // 0-180 gün önce
      const invoiceDate = new Date();
      invoiceDate.setDate(invoiceDate.getDate() - randomDaysAgo);
      
      const discount = Math.random() * 0.2; // 0-20% indirim
      const finalPrice = randomProduct.price * (1 - discount);

      await prisma.sale.create({
        data: {
          customerId: customer.id,
          title: randomProduct.name,
          description: randomProduct.description || 'Kaliteli ürün',
          imageUrl: randomProduct.imageUrl,
          invoiceDate: invoiceDate,
          amount: Math.round(finalPrice * 100) / 100
        }
      });
    }
  }

  // Update customer totals
  console.log('🔄 Müşteri toplamları güncelleniyor...');
  
  for (const customer of allCustomers) {
    const sales = await prisma.sale.findMany({
      where: { customerId: customer.id },
      select: { amount: true }
    });

    const totalSpent = sales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalOrders = sales.length;

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        totalSpent: totalSpent,
        totalOrders: totalOrders,
        averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0
      }
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('📧 Test accounts created:');
  console.log('- Mağaza Müdürü: mudur@olka.com / 123456');
  console.log('- Satış Danışmanı: satis@olka.com / 123456');
  console.log('- Runner: runner@olka.com / 123456');
  console.log(`🛍️ ${allCustomers.length} müşteriye satış geçmişi eklendi!`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
