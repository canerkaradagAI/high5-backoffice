import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Try read consultantId from body
    let consultantId: string | null = null;
    try {
      const body = await request.json().catch(() => ({} as any));
      consultantId = (body?.consultantId as string) || null;
    } catch {
      consultantId = null;
    }

      // If not provided, fallback to current authenticated user
      if (!consultantId) {
        const session = await getServerSession(authOptions);
        consultantId = (session?.user as any)?.id ?? null;
        console.log('Session user ID:', consultantId);
        console.log('Session user data:', session?.user);
      }

      // If still missing, block instead of assigning to arbitrary user
      if (!consultantId) {
        return NextResponse.json({ error: 'Oturum bulunamadı veya danışman belirlenemedi' }, { status: 401 });
      }

    // Check if the consultant exists in the database
    const consultant = await prisma.user.findUnique({
      where: { id: consultantId },
      select: { 
        id: true, 
        firstName: true, 
        lastName: true, 
        isActive: true,
        consultingCustomers: true
      }
    });

    if (!consultant) {
      return NextResponse.json({ error: 'Belirtilen danışman bulunamadı' }, { status: 404 });
    }

    if (!consultant.isActive) {
      return NextResponse.json({ error: 'Belirtilen danışman aktif değil' }, { status: 400 });
    }

    // Get customer limit from parameters
    const parameter = await prisma.parameter.findUnique({
      where: { key: 'MAX_CUSTOMER_PER_CONSULTANT' }
    });
    
    const MAX_CUSTOMERS_PER_CONSULTANT = parameter ? parseInt(parameter.value) : 1;
    const currentCustomerCount = consultant.consultingCustomers.length;
    
    if (currentCustomerCount >= MAX_CUSTOMERS_PER_CONSULTANT) {
      return NextResponse.json({ 
        error: `${consultant.firstName} ${consultant.lastName} zaten ${MAX_CUSTOMERS_PER_CONSULTANT} müşteriye sahip. Boşta satış danışmanı var, lütfen onu tercih edin.` 
      }, { status: 400 });
    }

    console.log(`${consultant.firstName} ${consultant.lastName}: ${currentCustomerCount}/${MAX_CUSTOMERS_PER_CONSULTANT} müşteri`);

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
