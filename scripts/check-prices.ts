import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPrices() {
  try {
    const stats = await prisma.product.aggregate({
      _min: { price: true },
      _max: { price: true },
      _avg: { price: true },
      _count: { price: true }
    });
    
    console.log('📊 Fiyat İstatistikleri:');
    console.log('   • En düşük fiyat:', stats._min.price, 'TL');
    console.log('   • En yüksek fiyat:', stats._max.price, 'TL');
    console.log('   • Ortalama fiyat:', Math.round(stats._avg.price || 0), 'TL');
    console.log('   • Toplam ürün:', stats._count.price, 'adet');
    
    // Fiyat aralıklarına göre dağılım
    const priceRanges = [
      { min: 5999, max: 6499, label: '5999-6499 TL' },
      { min: 6500, max: 6999, label: '6500-6999 TL' },
      { min: 7000, max: 7499, label: '7000-7499 TL' },
      { min: 7500, max: 7999, label: '7500-7999 TL' },
      { min: 8000, max: 8499, label: '8000-8499 TL' },
      { min: 8500, max: 8999, label: '8500-8999 TL' }
    ];
    
    console.log('\n📈 Fiyat Aralığı Dağılımı:');
    for (const range of priceRanges) {
      const count = await prisma.product.count({
        where: {
          price: {
            gte: range.min,
            lte: range.max
          }
        }
      });
      const percentage = ((count / stats._count.price) * 100).toFixed(1);
      console.log(`   • ${range.label}: ${count} ürün (${percentage}%)`);
    }
    
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPrices();
