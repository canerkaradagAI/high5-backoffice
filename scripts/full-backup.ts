import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function fullBackup() {
  try {
    console.log('🔒 Tam veritabanı yedekleme başlatılıyor...');
    
    const backupDir = path.join(process.cwd(), 'backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    
    // Tüm tabloları sırayla oku (foreign key sırasına göre)
    console.log('📊 Veriler okunuyor...');
    
    const backupData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        totalRecords: 0
      },
      data: {
        // Auth tabloları
        accounts: await prisma.account.findMany(),
        sessions: await prisma.session.findMany(),
        verificationTokens: await prisma.verificationToken.findMany(),
        
        // Core tablolar
        users: await prisma.user.findMany(),
        roles: await prisma.role.findMany(),
        permissions: await prisma.permission.findMany(),
        userRoles: await prisma.userRole.findMany(),
        rolePermissions: await prisma.rolePermission.findMany(),
        
        // Business tablolar
        customers: await prisma.customer.findMany(),
        products: await prisma.product.findMany(),
        tasks: await prisma.task.findMany(),
        taskDefinitions: await prisma.taskDefinition.findMany(),
        
        // Transaction tablolar
        carts: await prisma.cart.findMany(),
        cartItems: await prisma.cartItem.findMany(),
        receipts: await prisma.receipt.findMany(),
        receiptItems: await prisma.receiptItem.findMany(),
        payments: await prisma.payment.findMany(),
        sales: await prisma.sale.findMany(),
        
        // System tablolar
        parameters: await prisma.parameter.findMany()
      }
    };
    
    // Toplam kayıt sayısını hesapla
    let totalRecords = 0;
    Object.values(backupData.data).forEach((records: any) => {
      totalRecords += records.length;
    });
    backupData.metadata.totalRecords = totalRecords;
    
    // JSON dosyasına yaz
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log('✅ Yedekleme tamamlandı!');
    console.log(`📁 Yedek dosyası: ${backupFile}`);
    console.log(`📊 Toplam kayıt: ${totalRecords}`);
    
    // Detaylı istatistikler
    console.log('\n📈 Tablo İstatistikleri:');
    Object.entries(backupData.data).forEach(([tableName, records]: [string, any]) => {
      console.log(`   • ${tableName}: ${records.length} kayıt`);
    });
    
    // SQLite dosyasını da kopyala
    const sqliteBackup = path.join(backupDir, `dev.db-${timestamp}`);
    const sqliteSource = path.join(process.cwd(), 'prisma', 'dev.db');
    
    if (fs.existsSync(sqliteSource)) {
      fs.copyFileSync(sqliteSource, sqliteBackup);
      console.log(`💾 SQLite dosyası kopyalandı: ${sqliteBackup}`);
    }
    
    return backupFile;
    
  } catch (error) {
    console.error('❌ Yedekleme hatası:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Script'i çalıştır
fullBackup().then(backupFile => {
  console.log(`\n🎉 Yedekleme başarılı! Dosya: ${backupFile}`);
}).catch(error => {
  console.error('💥 Yedekleme başarısız:', error);
  process.exit(1);
});
