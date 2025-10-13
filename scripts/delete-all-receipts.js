const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️ Tüm reyon fişleri siliniyor...');

  try {
    // Önce ReceiptItem'ları sil (foreign key constraint nedeniyle)
    const deletedReceiptItems = await prisma.receiptItem.deleteMany({});
    console.log(`✅ ${deletedReceiptItems.count} adet ReceiptItem silindi.`);

    // Ardından Payment'ları sil (foreign key constraint nedeniyle)
    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`✅ ${deletedPayments.count} adet Payment silindi.`);

    // Son olarak Receipt'leri sil
    const deletedReceipts = await prisma.receipt.deleteMany({});
    console.log(`✅ ${deletedReceipts.count} adet Receipt silindi.`);

    console.log('🗑️ Tüm reyon fişleri başarıyla silindi.');
  } catch (e) {
    console.error('Hata oluştu:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
