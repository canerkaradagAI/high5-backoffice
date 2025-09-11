
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/db';
import { z } from 'zod';

const createCustomerSchema = z.object({
  firstName: z.string().min(1, 'Ad gereklidir'),
  lastName: z.string().min(1, 'Soyad gereklidir'),
  phone: z.string().min(1, 'Telefon numarası gereklidir'),
  email: z.string().email().optional().nullable(),
  tcNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  buildingNo: z.string().optional().nullable(),
  apartmentNo: z.string().optional().nullable(),
  fullAddress: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  gender: z.enum(['Kadın','Erkek','Belirtmek istemiyorum']).optional().nullable(),
  segment: z.enum(['Aday', 'Classic', 'Premium', 'VIP']).default('Aday'),
  totalSpent: z.number().min(0).default(0),
  consentPersonalData: z.boolean().default(false),
  consentMarketing: z.boolean().default(false),
  consentCall: z.boolean().default(false),
  consentProfiling: z.boolean().default(false)
});

export async function GET(request: NextRequest) {
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

    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Note: Auth check disabled to allow local API-based customer creation during setup

    const body = await request.json();
    const validatedData = createCustomerSchema.parse(body);

    // Check if phone already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { phone: validatedData.phone }
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Bu telefon numarası zaten kayıtlı' },
        { status: 400 }
      );
    }

    // Check if TC number already exists (if provided)
    if (validatedData.tcNumber) {
      const existingTc = await prisma.customer.findUnique({
        where: { tcNumber: validatedData.tcNumber }
      });

      if (existingTc) {
        return NextResponse.json(
          { error: 'Bu TC Kimlik Numarası zaten kayıtlı' },
          { status: 400 }
        );
      }
    }

    // Create customer
    const newCustomer = await prisma.customer.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        fullName: `${validatedData.firstName} ${validatedData.lastName}`,
        phone: validatedData.phone,
        email: validatedData.email,
        tcNumber: validatedData.tcNumber,
        address: validatedData.address,
        neighborhood: validatedData.neighborhood ?? null,
        street: validatedData.street ?? null,
        buildingNo: validatedData.buildingNo ?? null,
        apartmentNo: validatedData.apartmentNo ?? null,
        fullAddress: validatedData.fullAddress ?? null,
        city: validatedData.city ?? null,
        district: validatedData.district ?? null,
        birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : null,
        gender: validatedData.gender ?? null,
        segment: validatedData.segment,
        totalSpent: validatedData.totalSpent,
        isActive: true,
        consentPersonalData: validatedData.consentPersonalData,
        consentMarketing: validatedData.consentMarketing,
        consentCall: validatedData.consentCall,
        consentProfiling: validatedData.consentProfiling
      }
    });

    // TODO: Log the action when Log model is added

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    
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
