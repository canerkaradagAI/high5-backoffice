import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	console.log('🔧 Reconciling sales with customer totals...');
	const customers = await prisma.customer.findMany({
		select: { id: true, createdAt: true, totalSpent: true }
	});
	let adjustments = 0;

	for (const c of customers) {
		const agg = await prisma.sale.aggregate({
			where: { customerId: c.id },
			_sum: { amount: true }
		});
		const currentSum = Number(agg._sum.amount || 0);
		const target = Number(c.totalSpent || 0);
		const diff = target - currentSum;
		if (diff === 0) continue;

		await prisma.sale.create({
			data: {
				customerId: c.id,
				title: 'Düzeltilmiş Satış (Toplam Eşitleme)',
				description: 'Müşteri kartındaki toplamla satışların toplamı eşitlendi',
				amount: diff,
				invoiceDate: new Date(c.createdAt),
			}
		});
		adjustments++;
	}

	console.log(`✅ Adjusted ${adjustments} customers`);
}

main()
	.catch((e) => { console.error(e); process.exit(1); })
	.finally(async () => { await prisma.$disconnect(); });
