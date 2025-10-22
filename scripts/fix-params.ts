import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const canonicalKey = 'max_customers_per_consultant'
  const legacyKey = 'MAX_CUSTOMER_PER_CONSULTANT'

  const legacy = await prisma.parameter.findFirst({ where: { key: legacyKey } })
  const canonical = await prisma.parameter.findFirst({ where: { key: canonicalKey } })

  if (legacy && !canonical) {
    await prisma.parameter.update({
      where: { id: legacy.id },
      data: { key: canonicalKey }
    })
    console.log(`🔧 Parametre anahtarı '${legacyKey}' -> '${canonicalKey}' olarak güncellendi.`)
  } else if (legacy && canonical) {
    // Keep canonical, remove legacy
    await prisma.parameter.delete({ where: { id: legacy.id } })
    console.log(`🗑️ Eski parametre '${legacyKey}' silindi, '${canonicalKey}' kullanılıyor.`)
  } else {
    console.log('✅ Parametre anahtarları zaten tutarlı.')
  }
}

main()
  .catch((e) => { console.error(e) })
  .finally(async () => { await prisma.$disconnect() })

