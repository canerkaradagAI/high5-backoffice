import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleProducts = [
	{ title: 'Skechers D\'Lites', amount: 1299 },
	{ title: 'Go Walk 5', amount: 1499 },
	{ title: 'Flex Appeal 3.0', amount: 1599 },
	{ title: 'Uno Stand On Air', amount: 2199 },
	{ title: 'Arch Fit Go Walk', amount: 1799 },
];

function randomInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
	console.log('🌱 Generating random sales for customers...');
	const customers = await prisma.customer.findMany({ select: { id: true } });
	let created = 0;

	for (const c of customers) {
		const numSales = Math.random() < 0.35 ? randomInt(1, 3) : 0; // ~%35 müşteriye satış ekle
		for (let i = 0; i < numSales; i++) {
			const p = sampleProducts[randomInt(0, sampleProducts.length - 1)];
			const daysAgo = randomInt(1, 120);
			await prisma.sale.create({
				data: {
					customerId: c.id,
					title: p.title,
					amount: p.amount + randomInt(-150, 250),
					invoiceDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
				}
			});
			created++;
		}
	}

	console.log(`✅ Created ${created} sales across ${customers.length} customers`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
