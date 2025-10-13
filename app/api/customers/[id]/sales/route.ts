import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Permission: view customers (and their sales)
    const userPermissions = (session?.user as any)?.permissions ?? [];
    const hasPermission = userPermissions?.some((p: any) => p?.name === 'Müşteri Görüntüleme');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = params;

    // Ensure customer exists (optional but helpful)
    const existing = await prisma.customer.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const sales = await prisma.sale.findMany({
      where: { customerId: id },
      orderBy: { invoiceDate: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        invoiceDate: true,
        amount: true,
        customerId: true,
        createdAt: true,
      }
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error('Error fetching sales for customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
