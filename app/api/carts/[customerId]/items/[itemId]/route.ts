import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PUT - Sepet item miktarını güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { customerId: string; itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customerId, itemId } = params;
    const body = await request.json();
    const { quantity } = body;

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Geçerli bir miktar giriniz' },
        { status: 400 }
      );
    }

    // Müşteriyi kontrol et
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { 
        id: true, 
        assignedConsultantId: true
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Sadece kendi müşterisi için sepet işlemi yapabilir
    if (customer.assignedConsultantId !== session.user.id) {
      return NextResponse.json(
        { error: 'Bu müşteri size atanmamış' }, 
        { status: 403 }
      );
    }

    // Item'ı güncelle
    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity }
    });

    // Sepet toplamını güncelle
    const items = await prisma.cartItem.findMany({
      where: { 
        cart: {
          customerId: customerId,
          status: 'OPEN'
        }
      }
    });

    const calculatedTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    await prisma.cart.updateMany({
      where: { 
        customerId: customerId,
        status: 'OPEN'
      },
      data: { totalAmount: calculatedTotal }
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('PUT /api/carts/[customerId]/items/[itemId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Sepet item'ını sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { customerId: string; itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customerId, itemId } = params;

    // Müşteriyi kontrol et
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { 
        id: true, 
        assignedConsultantId: true
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Sadece kendi müşterisi için sepet işlemi yapabilir
    if (customer.assignedConsultantId !== session.user.id) {
      return NextResponse.json(
        { error: 'Bu müşteri size atanmamış' }, 
        { status: 403 }
      );
    }

    // Item'ı sil
    await prisma.cartItem.delete({
      where: { id: itemId }
    });

    // Sepet toplamını güncelle
    const items = await prisma.cartItem.findMany({
      where: { 
        cart: {
          customerId: customerId,
          status: 'OPEN'
        }
      }
    });

    const calculatedTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    await prisma.cart.updateMany({
      where: { 
        customerId: customerId,
        status: 'OPEN'
      },
      data: { totalAmount: calculatedTotal }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/carts/[customerId]/items/[itemId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
