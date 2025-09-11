import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const nationalId = searchParams.get('nationalId');

    if (!phone && !email && !name && !nationalId) {
      return NextResponse.json({ error: 'Arama parametresi gerekli' }, { status: 400 });
    }

    const whereClause: any = {};

    if (phone) {
      whereClause.phone = { contains: phone };
    }

    if (email) {
      whereClause.email = { contains: email };
    }

    if (name) {
      whereClause.OR = [
        { firstName: { contains: name } },
        { lastName: { contains: name } },
        { fullName: { contains: name } }
      ];
    }

    if (nationalId) {
      whereClause.tcNumber = { contains: nationalId };
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        assignedConsultant: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    console.error('Error searching customers:', error);
    return NextResponse.json({ error: 'Müşteri arama sırasında hata oluştu', detail: String(error?.message || error) }, { status: 500 });
  }
}