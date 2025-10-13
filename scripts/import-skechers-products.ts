import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Skechers ürün verileri
const products = [
  { barcode: '8683030770925', itemCode: '216334TK BRN', colorCode: 'BRN', size: '10', description: 'GO WALK FLEX RAY' },
  { barcode: '8683030770932', itemCode: '216334TK BRN', colorCode: 'BRN', size: '10.5', description: 'GO WALK FLEX RAY' },
  { barcode: '8683030770949', itemCode: '216334TK BRN', colorCode: 'BRN', size: '11.5', description: 'GO WALK FLEX RAY' },
  { barcode: '8683030780894', itemCode: '216334TK BRN', colorCode: 'BRN', size: '12.5', description: 'GO WALK FLEX RAY' },
  { barcode: '8683030780900', itemCode: '216334TK BRN', colorCode: 'BRN', size: '13', description: 'GO WALK FLEX RAY' },
  { barcode: '8683030780887', itemCode: '216334TK BRN', colorCode: 'BRN', size: '6.5', description: 'GO WALK FLEX RAY' },
  { barcode: '8683030770871', itemCode: '216334TK BRN', colorCode: 'BRN', size: '7.5', description: 'GO WALK FLEX RAY' },
  { barcode: '8683030770888', itemCode: '216334TK BRN', colorCode: 'BRN', size: '8', description: 'GO WALK FLEX RAY' },
  { barcode: '8683030770895', itemCode: '216334TK BRN', colorCode: 'BRN', size: '8.5', description: 'GO WALK FLEX RAY' },
  { barcode: '8683030770901', itemCode: '216334TK BRN', colorCode: 'BRN', size: '9', description: 'GO WALK FLEX RAY' },
  { barcode: '8683030770918', itemCode: '216334TK BRN', colorCode: 'BRN', size: '9.5', description: 'GO WALK FLEX RAY' },
  { barcode: '198739626223', itemCode: '216783 TPE', colorCode: 'TPE', size: '10', description: 'GO WALK 8 PATE' },
  { barcode: '198739626230', itemCode: '216783 TPE', colorCode: 'TPE', size: '10.5', description: 'GO WALK 8 PATE' },
  { barcode: '198739626254', itemCode: '216783 TPE', colorCode: 'TPE', size: '11.5', description: 'GO WALK 8 PATE' },
  { barcode: '198739626179', itemCode: '216783 TPE', colorCode: 'TPE', size: '7.5', description: 'GO WALK 8 PATE' },
  { barcode: '198739626186', itemCode: '216783 TPE', colorCode: 'TPE', size: '8', description: 'GO WALK 8 PATE' },
  { barcode: '198739626193', itemCode: '216783 TPE', colorCode: 'TPE', size: '8.5', description: 'GO WALK 8 PATE' },
  { barcode: '198739626209', itemCode: '216783 TPE', colorCode: 'TPE', size: '9', description: 'GO WALK 8 PATE' },
  { barcode: '198739626216', itemCode: '216783 TPE', colorCode: 'TPE', size: '9.5', description: 'GO WALK 8 PATE' },
  { barcode: '198739931709', itemCode: '237789 BBK', colorCode: 'BBK', size: '10', description: 'EQUALIZER 5.0 TRAIL TUMBLER RIDGE' },
  { barcode: '198739931716', itemCode: '237789 BBK', colorCode: 'BBK', size: '10.5', description: 'EQUALIZER 5.0 TRAIL TUMBLER RIDGE' },
  { barcode: '198739931723', itemCode: '237789 BBK', colorCode: 'BBK', size: '11', description: 'EQUALIZER 5.0 TRAIL TUMBLER RIDGE' },
  { barcode: '198739931655', itemCode: '237789 BBK', colorCode: 'BBK', size: '7.5', description: 'EQUALIZER 5.0 TRAIL TUMBLER RIDGE' },
  { barcode: '198739931662', itemCode: '237789 BBK', colorCode: 'BBK', size: '8', description: 'EQUALIZER 5.0 TRAIL TUMBLER RIDGE' },
  { barcode: '198739931679', itemCode: '237789 BBK', colorCode: 'BBK', size: '8.5', description: 'EQUALIZER 5.0 TRAIL TUMBLER RIDGE' },
  { barcode: '198739931686', itemCode: '237789 BBK', colorCode: 'BBK', size: '9', description: 'EQUALIZER 5.0 TRAIL TUMBLER RIDGE' },
  { barcode: '198739931693', itemCode: '237789 BBK', colorCode: 'BBK', size: '9.5', description: 'EQUALIZER 5.0 TRAIL TUMBLER RIDGE' },
  { barcode: '198739847109', itemCode: '237806 LTGY', colorCode: 'LTGY', size: '10', description: 'HILLCREST 2.0' },
  { barcode: '198739847116', itemCode: '237806 LTGY', colorCode: 'LTGY', size: '10.5', description: 'HILLCREST 2.0' },
  { barcode: '198739847123', itemCode: '237806 LTGY', colorCode: 'LTGY', size: '11', description: 'HILLCREST 2.0' },
  { barcode: '198739847055', itemCode: '237806 LTGY', colorCode: 'LTGY', size: '7.5', description: 'HILLCREST 2.0' },
  { barcode: '198739847062', itemCode: '237806 LTGY', colorCode: 'LTGY', size: '8', description: 'HILLCREST 2.0' },
  { barcode: '198739847079', itemCode: '237806 LTGY', colorCode: 'LTGY', size: '8.5', description: 'HILLCREST 2.0' },
  { barcode: '198739847086', itemCode: '237806 LTGY', colorCode: 'LTGY', size: '9', description: 'HILLCREST 2.0' },
  { barcode: '198739847093', itemCode: '237806 LTGY', colorCode: 'LTGY', size: '9.5', description: 'HILLCREST 2.0' }
];

async function importProducts() {
  console.log('🚀 Skechers ürünleri import ediliyor...');
  
  let created = 0;
  let updated = 0;
  
  for (const productData of products) {
    try {
      // Renk kodlarını Türkçe'ye çevir
      const colorMap: { [key: string]: string } = {
        'BRN': 'Kahverengi',
        'TPE': 'Turuncu',
        'BBK': 'Siyah',
        'LTGY': 'Açık Gri'
      };
      
      const colorName = colorMap[productData.colorCode] || productData.colorCode;
      
      // Ürün adını oluştur
      const productName = `${productData.description} - ${colorName} - ${productData.size}`;
      
      // Ürünü upsert et (varsa güncelle, yoksa oluştur)
      const product = await prisma.product.upsert({
        where: { sku: productData.barcode },
        create: {
          sku: productData.barcode,
          name: productName,
          description: `${productData.description} - ${productData.itemCode}`,
          price: 0, // Fiyat bilgisi yok, sonradan güncellenebilir
          category: 'Ayakkabı',
          brand: 'Skechers',
          color: colorName,
          size: productData.size,
          isActive: true
        },
        update: {
          name: productName,
          description: `${productData.description} - ${productData.itemCode}`,
          color: colorName,
          size: productData.size,
          isActive: true
        }
      });
      
      if (product.createdAt.getTime() === product.updatedAt.getTime()) {
        created++;
        console.log(`✅ Oluşturuldu: ${productName}`);
      } else {
        updated++;
        console.log(`🔄 Güncellendi: ${productName}`);
      }
      
    } catch (error) {
      console.error(`❌ Hata: ${productData.barcode} - ${error}`);
    }
  }
  
  console.log(`\n📊 Özet:`);
  console.log(`✅ Oluşturulan: ${created} ürün`);
  console.log(`🔄 Güncellenen: ${updated} ürün`);
  console.log(`📦 Toplam: ${products.length} ürün işlendi`);
}

importProducts()
  .catch((error) => {
    console.error('❌ Import hatası:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Veritabanı bağlantısı kapatıldı');
  });
