import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Row {
	Barkod?: string;
	UrunKodu?: string;
	RenkKodu?: string;
	Beden?: string;
	Aciklama?: string;
	Tutar?: string;
}

function parseAmount(trAmount?: string): number {
	if (!trAmount) return 0;
	// 2.500,00 veya 2500 gibi TR formatlarını yakala
	const normalized = trAmount
		.replace(/\s/g, '')
		.replace(/\./g, '')
		.replace(/,/g, '.');
	const n = Number(normalized);
	return isNaN(n) ? 0 : n;
}

async function main() {
	const csvPath = process.argv[2];
	const customerArg = process.argv[3];
	if (!csvPath || !customerArg) {
		console.log('Kullanım: npx tsx app/scripts/import-sales-from-csv.ts <csvYolu> <customerId|ALL>');
		process.exit(1);
	}
	const abs = path.isAbsolute(csvPath) ? csvPath : path.join(process.cwd(), csvPath);
	const content = fs.readFileSync(abs, 'utf8');
	let records: Row[] = parse(content, { columns: true, skip_empty_lines: true, delimiter: ';' });
	// Eğer dosya virgül ile ayrılmışsa tekrar dene
	if (!records || records.length === 0 || Object.keys(records[0] || {}).length <= 1) {
		records = parse(content, { columns: true, skip_empty_lines: true, delimiter: ',' });
	}

	let created = 0;

	// Hedef müşteri listesi hazırlanır
	let targetCustomers: { id: string }[] = [];
	if (customerArg.toUpperCase() === 'ALL') {
		targetCustomers = await prisma.customer.findMany({ select: { id: true } });
		if (targetCustomers.length === 0) {
			console.log('Müşteri bulunamadı.');
			process.exit(1);
		}
	} else {
		const one = await prisma.customer.findUnique({ where: { id: customerArg }, select: { id: true } });
		if (!one) {
			console.log('Geçersiz customerId');
			process.exit(1);
		}
		targetCustomers = [one];
	}

	let roundRobin = 0;
	for (const r of records) {
		const sku = (r.UrunKodu || r.Barkod || '').toString().trim();
		if (!sku) continue;

		// Upsert product by SKU
		const product = await prisma.product.upsert({
			where: { sku },
			create: {
				sku,
				name: r.Aciklama?.toString().trim() || sku,
				description: r.Aciklama?.toString().trim() || null,
				price: parseAmount(r.Tutar) || 0,
				category: undefined,
				brand: undefined,
				color: r.RenkKodu?.toString().trim() || undefined,
				size: r.Beden?.toString().trim() || undefined,
				imageUrl: undefined,
			},
			update: {
				name: r.Aciklama?.toString().trim() || sku,
				description: r.Aciklama?.toString().trim() || null,
				price: parseAmount(r.Tutar) || 0,
				color: r.RenkKodu?.toString().trim() || undefined,
				size: r.Beden?.toString().trim() || undefined,
			}
		});

		const target = targetCustomers[roundRobin % targetCustomers.length].id;
		roundRobin++;

		await prisma.sale.create({
			data: {
				customerId: target,
				title: product.name,
				description: product.description,
				imageUrl: product.imageUrl,
				amount: parseAmount(r.Tutar) || product.price || 0,
				invoiceDate: new Date(),
			}
		});
		created++;
	}

	console.log(`✅ Imported ${created} sales for ${customerArg.toUpperCase() === 'ALL' ? targetCustomers.length + ' customers (round-robin)' : 'customer ' + customerArg}`);
}

main()
	.catch((e) => { console.error(e); process.exit(1); })
	.finally(async () => { await prisma.$disconnect(); });
