import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface BackupData {
  metadata: {
    exportedAt: string;
    version: string;
    totalRecords: number;
  };
  data: {
    accounts: any[];
    sessions: any[];
    verificationTokens: any[];
    users: any[];
    roles: any[];
    permissions: any[];
    userRoles: any[];
    rolePermissions: any[];
    customers: any[];
    products: any[];
    tasks: any[];
    taskDefinitions: any[];
    carts: any[];
    cartItems: any[];
    receipts: any[];
    receiptItems: any[];
    payments: any[];
    sales: any[];
    parameters: any[];
  };
}

async function verifyDataIntegrity() {
  try {
    console.log('🔍 Veri bütünlüğü kontrolü başlatılıyor...');
    
    // En son yedek dosyasını bul
    const backupDir = path.join(process.cwd(), 'backup');
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .sort()
      .reverse();
    
    const latestBackup = path.join(backupDir, backupFiles[0]);
    const backupContent = fs.readFileSync(latestBackup, 'utf-8');
    const backupData: BackupData = JSON.parse(backupContent);
    
    console.log(`📁 Kontrol edilen yedek: ${latestBackup}`);
    console.log(`📊 Beklenen toplam kayıt: ${backupData.metadata.totalRecords}`);
    
    // PostgreSQL'deki mevcut verileri say
    console.log('\n📊 PostgreSQL Veri Sayıları:');
    
    const currentCounts = {
      accounts: await prisma.account.count(),
      sessions: await prisma.session.count(),
      verificationTokens: await prisma.verificationToken.count(),
      users: await prisma.user.count(),
      roles: await prisma.role.count(),
      permissions: await prisma.permission.count(),
      userRoles: await prisma.userRole.count(),
      rolePermissions: await prisma.rolePermission.count(),
      customers: await prisma.customer.count(),
      products: await prisma.product.count(),
      tasks: await prisma.task.count(),
      taskDefinitions: await prisma.taskDefinition.count(),
      carts: await prisma.cart.count(),
      cartItems: await prisma.cartItem.count(),
      receipts: await prisma.receipt.count(),
      receiptItems: await prisma.receiptItem.count(),
      payments: await prisma.payment.count(),
      sales: await prisma.sale.count(),
      parameters: await prisma.parameter.count()
    };
    
    let totalCurrent = 0;
    let allMatch = true;
    
    Object.entries(currentCounts).forEach(([tableName, count]) => {
      const expectedCount = backupData.data[tableName as keyof typeof backupData.data].length;
      totalCurrent += count;
      
      const status = count === expectedCount ? '✅' : '❌';
      if (count !== expectedCount) allMatch = false;
      
      console.log(`   ${status} ${tableName}: ${count}/${expectedCount}`);
    });
    
    console.log(`\n📊 Toplam PostgreSQL kayıt: ${totalCurrent}`);
    console.log(`📊 Beklenen toplam kayıt: ${backupData.metadata.totalRecords}`);
    
    if (allMatch && totalCurrent === backupData.metadata.totalRecords) {
      console.log('\n🎉 Veri bütünlüğü tamamen doğru!');
      console.log('✅ Migration başarılı - Hiçbir veri kaybı yok!');
    } else {
      console.log('\n⚠️ Veri bütünlüğü sorunları tespit edildi!');
      console.log('❌ Migration kontrolü gerekli');
    }
    
    // Örnek veri kontrolü
    console.log('\n🔍 Örnek Veri Kontrolü:');
    
    // İlk kullanıcıyı kontrol et
    const firstUser = await prisma.user.findFirst();
    if (firstUser) {
      console.log(`   • İlk kullanıcı: ${firstUser.email} (${firstUser.firstName} ${firstUser.lastName})`);
    }
    
    // İlk ürünü kontrol et
    const firstProduct = await prisma.product.findFirst();
    if (firstProduct) {
      console.log(`   • İlk ürün: ${firstProduct.name} - ${firstProduct.price} TL`);
    }
    
    // İlk müşteriyi kontrol et
    const firstCustomer = await prisma.customer.findFirst();
    if (firstCustomer) {
      console.log(`   • İlk müşteri: ${firstCustomer.fullName} (${firstCustomer.phone})`);
    }
    
    // Fiyat aralığı kontrolü
    const priceStats = await prisma.product.aggregate({
      _min: { price: true },
      _max: { price: true },
      _avg: { price: true }
    });
    
    console.log(`   • Ürün fiyat aralığı: ${priceStats._min.price} - ${priceStats._max.price} TL`);
    console.log(`   • Ortalama fiyat: ${Math.round(priceStats._avg.price)} TL`);
    
  } catch (error) {
    console.error('❌ Veri bütünlüğü kontrol hatası:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Script'i çalıştır
verifyDataIntegrity().then(() => {
  console.log('\n🎉 Veri bütünlüğü kontrolü tamamlandı!');
}).catch(error => {
  console.error('💥 Kontrol başarısız:', error);
  process.exit(1);
});
