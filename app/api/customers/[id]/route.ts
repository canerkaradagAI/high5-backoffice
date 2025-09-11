
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/db';
import { z } from 'zod';

const updateCustomerSchema = z.object({
  firstName: z.string().min(1, 'Ad gereklidir'),
  lastName: z.string().min(1, 'Soyad gereklidir'),
  phone: z.string().min(1, 'Telefon numarası gereklidir'),
  email: z.string().email().optional().nullable(),
  tcNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  segment: z.enum(['Aday', 'Classic', 'Premium', 'VIP']).default('Aday'),
  totalSpent: z.number().min(0).default(0),
  consentPersonalData: z.boolean().optional(),
  consentMarketing: z.boolean().optional(),
  consentCall: z.boolean().optional(),
  consentProfiling: z.boolean().optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const userPermissions = session?.user?.permissions ?? [];
    const hasPermission = userPermissions?.some(p => p?.name === 'Müşteri Görüntüleme');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = params;
    
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        assignedConsultant: {
          select: { id: true, firstName: true, lastName: true }
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const validatedData = updateCustomerSchema.parse(body);

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        tcNumber: true,
        consentPersonalData: true,
        consentMarketing: true,
        consentCall: true,
        consentProfiling: true,
        assignedConsultantId: true
      }
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Policy: Authenticated users can update customers (Satış Danışmanı dahil)

    // Check if phone is taken by another customer
    if (validatedData.phone !== existingCustomer.phone) {
      const phoneTaken = await prisma.customer.findFirst({
        where: {
          phone: validatedData.phone,
          id: { not: id }
        }
      });

      if (phoneTaken) {
        return NextResponse.json(
          { error: 'Bu telefon numarası zaten kullanılıyor' },
          { status: 400 }
        );
      }
    }

    // Check if TC number is taken by another customer (if provided)
    if (validatedData.tcNumber && validatedData.tcNumber !== existingCustomer.tcNumber) {
      const tcTaken = await prisma.customer.findFirst({
        where: {
          tcNumber: validatedData.tcNumber,
          id: { not: id }
        }
      });

      if (tcTaken) {
        return NextResponse.json(
          { error: 'Bu TC Kimlik Numarası zaten kullanılıyor' },
          { status: 400 }
        );
      }
    }

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        fullName: `${validatedData.firstName} ${validatedData.lastName}`,
        phone: validatedData.phone,
        email: validatedData.email,
        tcNumber: validatedData.tcNumber,
        address: validatedData.address,
        segment: validatedData.segment,
        totalSpent: validatedData.totalSpent,
        consentPersonalData: validatedData.consentPersonalData ?? existingCustomer.consentPersonalData,
        consentMarketing: validatedData.consentMarketing ?? existingCustomer.consentMarketing,
        consentCall: validatedData.consentCall ?? existingCustomer.consentCall,
        consentProfiling: validatedData.consentProfiling ?? existingCustomer.consentProfiling
      }
    });

    // TODO: Log the action when Log model is added

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const userPermissions = session?.user?.permissions ?? [];
    const hasPermission = userPermissions?.some(p => p?.name === 'Müşteri Yönetimi');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = params;

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Delete customer
    await prisma.customer.delete({
      where: { id }
    });

    // TODO: Log the action when Log model is added

    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
