import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ProductData {
  Barcode: string;
  ItemDescription: string;
  Category: string;
  Brand: string;
  ColorDescription: string;
  Size: string;
  ImageUrl: string;
}

async function importProducts() {
  try {
    console.log('🚀 Ürün import işlemi başlatılıyor...');
    
    // CSV dosyasını oku
    const csvPath = path.join(process.cwd(), 'productnew.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // CSV'yi parse et
    const lines = csvContent.split('\n');
    const headers = lines[0].split(';');
    
    console.log(`📊 Toplam ${lines.length - 1} satır bulundu`);
    
    let successCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;
    
    // Her satırı işle (header'ı atla)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(';');
      
      if (values.length !== headers.length) {
        console.log(`⚠️ Satır ${i + 1}: Eksik veri - atlanıyor`);
        errorCount++;
        continue;
      }
      
      const productData: ProductData = {
        Barcode: values[0]?.trim(),
        ItemDescription: values[1]?.trim(),
        Category: values[2]?.trim(),
        Brand: values[3]?.trim(),
        ColorDescription: values[4]?.trim(),
        Size: values[5]?.trim(),
        ImageUrl: values[6]?.trim()
      };
      
      // Gerekli alanları kontrol et
      if (!productData.Barcode || !productData.ItemDescription) {
        console.log(`⚠️ Satır ${i + 1}: Eksik barcode veya açıklama - atlanıyor`);
        errorCount++;
        continue;
      }
      
      try {
        // Aynı SKU'ya sahip ürün var mı kontrol et
        const existingProduct = await prisma.product.findUnique({
          where: { sku: productData.Barcode }
        });
        
        if (existingProduct) {
          console.log(`🔄 Satır ${i + 1}: SKU ${productData.Barcode} zaten mevcut - güncelleniyor`);
          
          await prisma.product.update({
            where: { sku: productData.Barcode },
            data: {
              name: productData.ItemDescription,
              description: `${productData.Category} - ${productData.Brand}`,
              imageUrl: productData.ImageUrl,
              category: productData.Category,
              brand: productData.Brand,
              color: productData.ColorDescription,
              size: productData.Size,
              price: 0, // Fiyat bilgisi yok, varsayılan 0
              isActive: true
            }
          });
          
          duplicateCount++;
        } else {
          // Yeni ürün oluştur
          await prisma.product.create({
            data: {
              sku: productData.Barcode,
              name: productData.ItemDescription,
              description: `${productData.Category} - ${productData.Brand}`,
              imageUrl: productData.ImageUrl,
              category: productData.Category,
              brand: productData.Brand,
              color: productData.ColorDescription,
              size: productData.Size,
              price: 0, // Fiyat bilgisi yok, varsayılan 0
              isActive: true
            }
          });
          
          successCount++;
        }
        
        // Her 100 üründe bir progress göster
        if ((successCount + duplicateCount) % 100 === 0) {
          console.log(`📈 İşlenen: ${successCount + duplicateCount}/${lines.length - 1}`);
        }
        
      } catch (error) {
        console.log(`❌ Satır ${i + 1}: Hata - ${error}`);
        errorCount++;
      }
    }
    
    console.log('\n✅ Import işlemi tamamlandı!');
    console.log(`📊 İstatistikler:`);
    console.log(`   • Yeni ürün: ${successCount}`);
    console.log(`   • Güncellenen: ${duplicateCount}`);
    console.log(`   • Hata: ${errorCount}`);
    console.log(`   • Toplam işlenen: ${successCount + duplicateCount}`);
    
    // Toplam ürün sayısını göster
    const totalProducts = await prisma.product.count();
    console.log(`📦 Veritabanındaki toplam ürün sayısı: ${totalProducts}`);
    
  } catch (error) {
    console.error('❌ Import işleminde hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Script'i çalıştır
importProducts();
