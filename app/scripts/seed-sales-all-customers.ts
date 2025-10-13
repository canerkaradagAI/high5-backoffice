import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	console.log('🌱 Ensuring every customer has at least one sale...');
	const customers = await prisma.customer.findMany({ select: { id: true, firstName: true, lastName: true } });
	let created = 0;

	for (const c of customers) {
		const existingCount = await prisma.sale.count({ where: { customerId: c.id } });
		if (existingCount > 0) continue;

		await prisma.sale.create({
			data: {
				customerId: c.id,
				title: 'Mağaza Satışı',
				description: 'Varsayılan oluşturulan satış kaydı',
				amount: 1000,
				invoiceDate: new Date(),
				imageUrl: null,
			}
		});
		created++;
	}

	console.log(`✅ Created ${created} missing sales for ${customers.length} customers`);
}

main()
	.catch((e) => { console.error(e); process.exit(1); })
	.finally(async () => { await prisma.$disconnect(); });
