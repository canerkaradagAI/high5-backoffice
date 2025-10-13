const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🖼️ Her ürün serisi için benzersiz görseller atanıyor...');

  // Her seri için farklı görsel URL'leri
  const imageMappings = [
    {
      pattern: 'GO WALK FLEX RAY',
      imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center',
      description: 'Kahverengi spor ayakkabı'
    },
    {
      pattern: 'GO WALK 8 PATE',
      imageUrl: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop&crop=center',
      description: 'Turuncu spor ayakkabı'
    },
    {
      pattern: 'EQUALIZER',
      imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop&crop=center',
      description: 'Siyah spor ayakkabı'
    },
    {
      pattern: 'HILLCREST',
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&crop=center',
      description: 'Gri spor ayakkabı'
    }
  ];

  for (const mapping of imageMappings) {
    const products = await prisma.product.findMany({
      where: {
        name: {
          contains: mapping.pattern
        },
        brand: 'Skechers'
      }
    });

    console.log(`\n📦 ${mapping.pattern} serisi: ${products.length} ürün bulundu`);

    for (const product of products) {
      await prisma.product.update({
        where: { id: product.id },
        data: { 
          imageUrl: mapping.imageUrl,
          description: `${mapping.description} - ${product.name}`
        }
      });
      console.log(`✅ ${product.name} - ${mapping.description}`);
    }
  }

  // Tüm Skechers ürünlerini kontrol et
  const allSkechersProducts = await prisma.product.findMany({
    where: { brand: 'Skechers' },
    select: { name: true, imageUrl: true }
  });

  console.log(`\n📊 Özet:`);
  console.log(`📦 Toplam Skechers ürünü: ${allSkechersProducts.length}`);
  
  // Görsel çeşitliliğini kontrol et
  const uniqueImages = [...new Set(allSkechersProducts.map(p => p.imageUrl))];
  console.log(`🖼️ Benzersiz görsel sayısı: ${uniqueImages.length}`);
  
  // Her görsel için kaç ürün olduğunu göster
  const imageCounts = {};
  allSkechersProducts.forEach(product => {
    imageCounts[product.imageUrl] = (imageCounts[product.imageUrl] || 0) + 1;
  });
  
  console.log(`\n📈 Görsel dağılımı:`);
  Object.entries(imageCounts).forEach(([imageUrl, count]) => {
    console.log(`   ${imageUrl.split('/').pop()} → ${count} ürün`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
