import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Müşterinin açık sepetini getir
export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customerId } = params;

    // Müşteriyi kontrol et
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { 
        id: true, 
        assignedConsultantId: true,
        firstName: true,
        lastName: true
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Açık sepeti bul
    const openCart = await prisma.cart.findFirst({
      where: {
        customerId: customerId,
        status: 'OPEN'
      },
      include: {
        items: true
      }
    });

    // Sepet yoksa veya boşsa 404 döndür
    if (!openCart || !openCart.items || openCart.items.length === 0) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    return NextResponse.json(openCart);
  } catch (error) {
    console.error('GET /api/carts/[customerId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Müşteri için yeni sepet oluştur
export async function POST(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customerId } = params;

    // Müşteriyi kontrol et
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { 
        id: true, 
        assignedConsultantId: true,
        firstName: true,
        lastName: true
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Sadece kendi müşterisi için sepet oluşturabilir
    if (customer.assignedConsultantId !== session.user.id) {
      return NextResponse.json(
        { error: 'Bu müşteri size atanmamış' }, 
        { status: 403 }
      );
    }

    // Zaten açık sepet var mı kontrol et
    const existingOpenCart = await prisma.cart.findFirst({
      where: {
        customerId: customerId,
        status: 'OPEN'
      }
    });

    if (existingOpenCart) {
      return NextResponse.json(
        { error: 'Bu müşteri için zaten açık sepet mevcut' },
        { status: 400 }
      );
    }

    // Yeni sepet oluştur
    const newCart = await prisma.cart.create({
      data: {
        customerId: customerId,
        status: 'OPEN',
        totalAmount: 0
      },
      include: {
        items: true
      }
    });

    return NextResponse.json(newCart, { status: 201 });
  } catch (error) {
    console.error('POST /api/carts/[customerId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
