import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Test için geçici PostgreSQL URL (gerçek PostgreSQL database gerekli)
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

async function testMigration() {
  try {
    console.log('🧪 Migration test başlatılıyor...');
    
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
    
    // Veri istatistikleri
    console.log('\n📈 Yedeklenen Veri İstatistikleri:');
    Object.entries(backupData.data).forEach(([tableName, records]) => {
      console.log(`   • ${tableName}: ${records.length} kayıt`);
    });
    
    // PostgreSQL bağlantısını test et
    console.log('\n🔌 PostgreSQL bağlantısı test ediliyor...');
    try {
      await prisma.$connect();
      console.log('✅ PostgreSQL bağlantısı başarılı!');
      
      // Basit bir test sorgusu
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      console.log('✅ Test sorgusu başarılı!');
      
    } catch (error) {
      console.log('❌ PostgreSQL bağlantı hatası:', error);
      console.log('💡 Çözüm:');
      console.log('   1. Vercel Dashboard → Storage → Create Database → PostgreSQL');
      console.log('   2. Connection string\'i kopyala');
      console.log('   3. .env dosyasında DATABASE_URL\'i güncelle');
      console.log('   4. Tekrar dene');
      return;
    }
    
    console.log('\n🎉 Migration test başarılı!');
    console.log('📝 Sonraki adımlar:');
    console.log('   1. PostgreSQL database oluştur');
    console.log('   2. DATABASE_URL environment variable ayarla');
    console.log('   3. npx prisma migrate deploy çalıştır');
    console.log('   4. Migration scriptini çalıştır');
    
  } catch (error) {
    console.error('❌ Test hatası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Script'i çalıştır
testMigration().then(() => {
  console.log('\n🎉 Test tamamlandı!');
}).catch(error => {
  console.error('💥 Test başarısız:', error);
  process.exit(1);
});
