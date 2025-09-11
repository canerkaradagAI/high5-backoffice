import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';

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
      whereClause.phone = { contains: phone, mode: 'insensitive' };
    }

    if (email) {
      whereClause.email = { contains: email, mode: 'insensitive' };
    }

    if (name) {
      whereClause.OR = [
        { firstName: { contains: name, mode: 'insensitive' } },
        { lastName: { contains: name, mode: 'insensitive' } },
        { fullName: { contains: name, mode: 'insensitive' } }
      ];
    }

    if (nationalId) {
      whereClause.tcNumber = { contains: nationalId, mode: 'insensitive' };
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        assignedConsultant: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error searching customers:', error);
    return NextResponse.json({ error: 'Müşteri arama sırasında hata oluştu' }, { status: 500 });
  }
}


