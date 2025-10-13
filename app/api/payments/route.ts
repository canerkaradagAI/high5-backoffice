import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST - Ödeme işlemi
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { receiptId, amount, method, reference } = body;

    // Validation
    if (!receiptId || !amount || !method) {
      return NextResponse.json(
        { error: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }

    // Fişi kontrol et
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: {
        consultant: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    if (!receipt) {
      return NextResponse.json({ error: 'Fiş bulunamadı' }, { status: 404 });
    }

    // Sadece fişi oluşturan danışman ödeme alabilir
    if (receipt.consultantId !== session.user.id) {
      return NextResponse.json(
        { error: 'Bu fiş size ait değil' }, 
        { status: 403 }
      );
    }

    // Ödeme tutarı kontrolü
    if (amount !== receipt.totalAmount) {
      return NextResponse.json(
        { error: 'Ödeme tutarı fiş tutarı ile eşleşmiyor' },
        { status: 400 }
      );
    }

    // Ödeme oluştur
    const payment = await prisma.payment.create({
      data: {
        receiptId,
        amount,
        method,
        reference: reference || null,
        status: 'COMPLETED'
      }
    });

    // Fiş durumunu güncelle
    await prisma.receipt.update({
      where: { id: receiptId },
      data: { status: 'PAID' }
    });

    // Müşteri istatistiklerini güncelle
    await prisma.customer.update({
      where: { id: receipt.customerId },
      data: {
        totalSpent: {
          increment: amount
        },
        totalOrders: {
          increment: 1
        },
        lastVisit: new Date()
      }
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Ödemeleri listele
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const receiptId = searchParams.get('receiptId');

    const where = receiptId ? { receiptId } : {};

    const payments = await prisma.payment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        receipt: {
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
            }
          }
        }
      }
    });

    const total = await prisma.payment.count({ where });

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
