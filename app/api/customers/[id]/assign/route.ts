import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

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
        consultingCustomers: {
          select: { id: true }
        }
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
      where: { key: 'max_customers_per_consultant' }
    });
    
    const MAX_CUSTOMERS_PER_CONSULTANT = parameter ? parseInt(parameter.value) : 1;
    const currentCustomerCount = consultant.consultingCustomers.length;
    
    // Check if current user is a Sales Consultant
    const isCurrentUserSalesConsultant = await prisma.userRole.findFirst({
      where: {
        userId: consultantId,
        role: {
          name: 'Satış Danışmanı'
        },
        isActive: true
      }
    });

    // Only apply limit for Sales Consultants
    if (isCurrentUserSalesConsultant) {
      // Check if there are any OTHER consultants with fewer customers than the limit
      const consultantsWithSpace = await prisma.user.findMany({
        where: {
          isActive: true,
          id: { not: consultantId }, // Exclude current user
          userRoles: {
            some: {
              role: {
                name: 'Satış Danışmanı'
              },
              isActive: true
            }
          }
        },
        include: {
          consultingCustomers: {
            select: { id: true }
          }
        }
      });

      // Find OTHER consultants who have space (less than the limit)
      const availableConsultants = consultantsWithSpace.filter(c => 
        c.consultingCustomers.length < MAX_CUSTOMERS_PER_CONSULTANT
      );

      // If there are available consultants and current consultant is at limit, block assignment
      if (availableConsultants.length > 0 && currentCustomerCount >= MAX_CUSTOMERS_PER_CONSULTANT) {
        return NextResponse.json({ 
          error: `${consultant.firstName} ${consultant.lastName} zaten ${MAX_CUSTOMERS_PER_CONSULTANT} müşteriye sahip. Boşta satış danışmanı var, lütfen onu tercih edin.` 
        }, { status: 400 });
      }

      console.log(`${consultant.firstName} ${consultant.lastName}: ${currentCustomerCount}/${MAX_CUSTOMERS_PER_CONSULTANT} müşteri (Boşta danışman: ${availableConsultants.length})`);
    } else {
      console.log(`${consultant.firstName} ${consultant.lastName}: ${currentCustomerCount} müşteri (Mağaza Müdürü - limit yok)`);
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
