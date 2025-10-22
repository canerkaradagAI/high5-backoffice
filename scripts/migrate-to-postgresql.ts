import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// PostgreSQL için Prisma client
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

async function migrateToPostgreSQL() {
  try {
    console.log('🔄 PostgreSQL migration başlatılıyor...');
    
    // En son yedek dosyasını bul
    const backupDir = path.join(process.cwd(), 'backup');
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .sort()
      .reverse();
    
    if (backupFiles.length === 0) {
      throw new Error('Yedek dosyası bulunamadı!');
    }
    
    const latestBackup = path.join(backupDir, backupFiles[0]);
    console.log(`📁 Yedek dosyası: ${latestBackup}`);
    
    // Yedek dosyasını oku
    const backupContent = fs.readFileSync(latestBackup, 'utf-8');
    const backupData: BackupData = JSON.parse(backupContent);
    
    console.log(`📊 Toplam kayıt: ${backupData.metadata.totalRecords}`);
    console.log(`📅 Yedek tarihi: ${backupData.metadata.exportedAt}`);
    
    // PostgreSQL'de tabloları temizle (dikkatli!)
    console.log('\n🧹 Mevcut PostgreSQL verileri temizleniyor...');
    
    // Foreign key kısıtlamalarını geçici olarak devre dışı bırak
    await prisma.$executeRaw`SET session_replication_role = replica;`;
    
    // Tüm tabloları temizle (ters sırada)
    const tablesToClean = [
      'Payment', 'ReceiptItem', 'Receipt', 'Sale',
      'CartItem', 'Cart', 'Task', 'TaskDefinition',
      'RolePermission', 'UserRole', 'Permission', 'Role',
      'Customer', 'Product', 'User',
      'VerificationToken', 'Session', 'Account'
    ];
    
    for (const table of tablesToClean) {
      try {
        await prisma.$executeRawUnsafe(`DELETE FROM "${table}";`);
        console.log(`   ✅ ${table} temizlendi`);
      } catch (error) {
        console.log(`   ⚠️ ${table} temizlenemedi (muhtemelen boş): ${error}`);
      }
    }
    
    // Foreign key kısıtlamalarını tekrar etkinleştir
    await prisma.$executeRaw`SET session_replication_role = DEFAULT;`;
    
    console.log('\n📥 Veriler PostgreSQL\'e aktarılıyor...');
    
    let importedCount = 0;
    const importOrder = [
      // Auth tabloları
      { name: 'Account', data: backupData.data.accounts },
      { name: 'Session', data: backupData.data.sessions },
      { name: 'VerificationToken', data: backupData.data.verificationTokens },
      
      // Core tablolar
      { name: 'User', data: backupData.data.users },
      { name: 'Role', data: backupData.data.roles },
      { name: 'Permission', data: backupData.data.permissions },
      { name: 'UserRole', data: backupData.data.userRoles },
      { name: 'RolePermission', data: backupData.data.rolePermissions },
      
      // Business tablolar
      { name: 'Customer', data: backupData.data.customers },
      { name: 'Product', data: backupData.data.products },
      { name: 'TaskDefinition', data: backupData.data.taskDefinitions },
      { name: 'Task', data: backupData.data.tasks },
      
      // Transaction tablolar
      { name: 'Cart', data: backupData.data.carts },
      { name: 'CartItem', data: backupData.data.cartItems },
      { name: 'Receipt', data: backupData.data.receipts },
      { name: 'ReceiptItem', data: backupData.data.receiptItems },
      { name: 'Payment', data: backupData.data.payments },
      { name: 'Sale', data: backupData.data.sales },
      
      // System tablolar
      { name: 'Parameter', data: backupData.data.parameters }
    ];
    
    for (const { name, data } of importOrder) {
      if (data.length === 0) {
        console.log(`   ⏭️ ${name}: Boş tablo, atlanıyor`);
        continue;
      }
      
      console.log(`   📥 ${name}: ${data.length} kayıt aktarılıyor...`);
      
      try {
        // Batch insert (PostgreSQL için optimize edilmiş)
        const modelName = name === 'UserRole' ? 'userRole' : 
                          name === 'RolePermission' ? 'rolePermission' : 
                          name === 'TaskDefinition' ? 'taskDefinition' : 
                          name === 'CartItem' ? 'cartItem' : 
                          name === 'ReceiptItem' ? 'receiptItem' : 
                          name.toLowerCase();
        const model = (prisma as any)[modelName];
        if (model && model.createMany) {
          await model.createMany({
            data: data,
            skipDuplicates: true
          });
        } else {
          // Eğer createMany yoksa tek tek ekle
          for (const record of data) {
            await model.create({ data: record });
          }
        }
        
        importedCount += data.length;
        console.log(`   ✅ ${name}: ${data.length} kayıt başarıyla aktarıldı`);
        
      } catch (error) {
        console.error(`   ❌ ${name} aktarım hatası:`, error);
        throw error;
      }
    }
    
    console.log('\n🎉 Migration tamamlandı!');
    console.log(`📊 Toplam aktarılan kayıt: ${importedCount}`);
    console.log(`📊 Beklenen kayıt: ${backupData.metadata.totalRecords}`);
    
    if (importedCount === backupData.metadata.totalRecords) {
      console.log('✅ Veri bütünlüğü doğrulandı!');
    } else {
      console.log('⚠️ Veri sayısı uyuşmuyor, kontrol gerekli!');
    }
    
    // Son kontrol - örnek veriler
    console.log('\n🔍 Son Kontrol:');
    const userCount = await prisma.user.count();
    const productCount = await prisma.product.count();
    const customerCount = await prisma.customer.count();
    
    console.log(`   • Kullanıcılar: ${userCount}`);
    console.log(`   • Ürünler: ${productCount}`);
    console.log(`   • Müşteriler: ${customerCount}`);
    
  } catch (error) {
    console.error('❌ Migration hatası:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Script'i çalıştır
migrateToPostgreSQL().then(() => {
  console.log('\n🎉 PostgreSQL migration başarılı!');
}).catch(error => {
  console.error('💥 Migration başarısız:', error);
  process.exit(1);
});