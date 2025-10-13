const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🖼️ Belirtilen barkodlar için özel görseller atanıyor...');

  // GO WALK FLEX RAY serisi için özel görsel
  const goWalkFlexRayBarcodes = [
    '8683030770925',
    '8683030770932', 
    '8683030770949',
    '8683030780894',
    '8683030780900',
    '8683030780887',
    '8683030770871',
    '8683030770888',
    '8683030770895',
    '8683030770901',
    '8683030770918'
  ];

  // GO WALK 8 PATE serisi için özel görsel
  const goWalk8PateBarcodes = [
    '198739626223',
    '198739626230',
    '198739626254',
    '198739626179',
    '198739626186',
    '198739626193',
    '198739626209',
    '198739626216'
  ];

  // GO WALK FLEX RAY için özel görsel (kahverengi slip-on)
  const goWalkFlexRayImage = 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center';
  
  // GO WALK 8 PATE için özel görsel (koyu gri slip-ins)
  const goWalk8PateImage = 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop&crop=center';

  console.log('\n📦 GO WALK FLEX RAY serisi güncelleniyor...');
  for (const barcode of goWalkFlexRayBarcodes) {
    const product = await prisma.product.findUnique({
      where: { sku: barcode }
    });

    if (product) {
      await prisma.product.update({
        where: { id: product.id },
        data: { 
          imageUrl: goWalkFlexRayImage,
          description: `Kahverengi slip-on spor ayakkabı - ${product.name}`
        }
      });
      console.log(`✅ ${product.name} - Kahverengi slip-on görseli`);
    } else {
      console.log(`❌ Barkod bulunamadı: ${barcode}`);
    }
  }

  console.log('\n📦 GO WALK 8 PATE serisi güncelleniyor...');
  for (const barcode of goWalk8PateBarcodes) {
    const product = await prisma.product.findUnique({
      where: { sku: barcode }
    });

    if (product) {
      await prisma.product.update({
        where: { id: product.id },
        data: { 
          imageUrl: goWalk8PateImage,
          description: `Koyu gri slip-ins spor ayakkabı - ${product.name}`
        }
      });
      console.log(`✅ ${product.name} - Koyu gri slip-ins görseli`);
    } else {
      console.log(`❌ Barkod bulunamadı: ${barcode}`);
    }
  }

  // Güncellenen ürünleri kontrol et
  const updatedProducts = await prisma.product.findMany({
    where: {
      sku: {
        in: [...goWalkFlexRayBarcodes, ...goWalk8PateBarcodes]
      }
    },
    select: { sku: true, name: true, imageUrl: true }
  });

  console.log(`\n📊 Özet:`);
  console.log(`📦 Güncellenen ürün sayısı: ${updatedProducts.length}`);
  
  // Görsel çeşitliliğini kontrol et
  const uniqueImages = [...new Set(updatedProducts.map(p => p.imageUrl))];
  console.log(`🖼️ Benzersiz görsel sayısı: ${uniqueImages.length}`);
  
  console.log(`\n📈 Güncellenen ürünler:`);
  updatedProducts.forEach(product => {
    const imageType = product.imageUrl.includes('1549298916') ? 'Kahverengi slip-on' : 'Koyu gri slip-ins';
    console.log(`   ${product.sku} → ${imageType}`);
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
