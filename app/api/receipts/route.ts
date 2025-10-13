import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST - Reyon fişi oluştur
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // Geçici olarak authentication kontrolünü kaldırdık
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const { customerId, receiptNumber, totalAmount, cartItemsCount, type } = body;
    
    console.log('📋 Receipt API received data:', {
      customerId,
      receiptNumber,
      totalAmount,
      cartItemsCount,
      type,
      body
    });

    // Validation
    if (!customerId || !receiptNumber || !totalAmount) {
      return NextResponse.json(
        { 
          error: 'Gerekli alanlar eksik',
          details: {
            customerId: customerId || 'EKSIK',
            receiptNumber: receiptNumber || 'EKSIK', 
            totalAmount: totalAmount || 'EKSIK'
          }
        },
        { status: 400 }
      );
    }

    // Müşteriyi kontrol et
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { 
        id: true, 
        firstName: true,
        lastName: true,
        assignedConsultantId: true
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 });
    }

    // Geçici olarak consultant kontrolünü kaldırdık
    // if (customer.assignedConsultantId !== session.user.id) {
    //   return NextResponse.json(
    //     { error: 'Bu müşteri size atanmamış' }, 
    //     { status: 403 }
    //   );
    // }

    // Açık sepeti bul
    const cart = await prisma.cart.findFirst({
      where: {
        customerId: customerId,
        status: 'OPEN'
      },
      include: {
        items: true
      }
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { 
          error: 'Açık sepet bulunamadı',
          details: {
            customerId,
            cartFound: !!cart,
            cartItemsCount: cart?.items?.length || 0
          }
        },
        { status: 400 }
      );
    }

    // Reyon fişi oluştur
    const receipt = await prisma.receipt.create({
      data: {
        receiptNumber,
        customerId,
        consultantId: session?.user?.id || 'default-consultant',
        totalAmount,
        itemCount: cartItemsCount,
        type: type || 'REYON_RECEIPT',
        status: 'CREATED',
        items: {
          create: cart.items.map(item => ({
            sku: item.sku,
            title: item.title,
            description: item.description,
            imageUrl: item.imageUrl,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice
          }))
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        consultant: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        items: true
      }
    });

    // Sepeti kapat
    await prisma.cart.update({
      where: { id: cart.id },
      data: { status: 'COMPLETED' }
    });

    return NextResponse.json(receipt, { status: 201 });
  } catch (error) {
    console.error('Error creating receipt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Fişleri listele
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const customerId = searchParams.get('customerId');

    const where = customerId ? { customerId } : {};

    const receipts = await prisma.receipt.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        consultant: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        items: true
      }
    });

    const total = await prisma.receipt.count({ where });

    return NextResponse.json({
      receipts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
