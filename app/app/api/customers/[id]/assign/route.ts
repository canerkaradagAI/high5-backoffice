import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    let consultantId: string | null = null;
    try {
      const body = await request.json().catch(() => ({} as any));
      consultantId = (body?.consultantId as string) || null;
    } catch {
      consultantId = null;
    }

    if (!consultantId) {
      const anyUser = await prisma.user.findFirst({ where: { isActive: true }, select: { id: true } });
      consultantId = anyUser?.id ?? null;
    }

    if (!consultantId) {
      return NextResponse.json({ error: 'Danışman belirlenemedi' }, { status: 400 });
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: { assignedConsultantId: consultantId },
      include: { assignedConsultant: { select: { id: true, firstName: true, lastName: true } } }
    });

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error('Error assigning customer:', error);
    return NextResponse.json({ error: 'Müşteri atanamadı' }, { status: 500 });
  }
}
