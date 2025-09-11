import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST - Sepete ürün ekle
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
    const body = await request.json();
    const { sku, title, description, imageUrl, quantity = 1, unitPrice } = body;

    // Validation
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Ürün adı gereklidir' },
        { status: 400 }
      );
    }

    if (!unitPrice || unitPrice <= 0) {
      return NextResponse.json(
        { error: 'Geçerli bir fiyat giriniz' },
        { status: 400 }
      );
    }

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

    // Sadece kendi müşterisi için sepet işlemi yapabilir
    if (customer.assignedConsultantId !== session.user.id) {
      return NextResponse.json(
        { error: 'Bu müşteri size atanmamış' }, 
        { status: 403 }
      );
    }

    // Açık sepeti bul veya oluştur
    let cart = await prisma.cart.findFirst({
      where: {
        customerId: customerId,
        status: 'OPEN'
      }
    });

    if (!cart) {
      // Sepet yoksa oluştur
      cart = await prisma.cart.create({
        data: {
          customerId: customerId,
          status: 'OPEN',
          totalAmount: 0
        }
      });
    }

    // Aynı SKU'ya sahip ürün var mı kontrol et
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        sku: sku || null
      }
    });

    let cartItem;
    if (existingItem) {
      // Mevcut ürünün miktarını artır
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity
        }
      });
    } else {
      // Yeni ürün ekle
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          sku: sku || null,
          title: title.trim(),
          quantity,
          unitPrice
        }
      });
    }

    // Sepet toplamını güncelle
    const totalAmount = await prisma.cartItem.aggregate({
      where: { cartId: cart.id },
      _sum: {
        unitPrice: true
      }
    });

    const itemTotal = await prisma.cartItem.aggregate({
      where: { cartId: cart.id },
      _sum: {
        unitPrice: true
      }
    });

    // Her item için quantity * unitPrice hesapla
    const items = await prisma.cartItem.findMany({
      where: { cartId: cart.id }
    });

    const calculatedTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    await prisma.cart.update({
      where: { id: cart.id },
      data: { totalAmount: calculatedTotal }
    });

    return NextResponse.json(cartItem, { status: 201 });
  } catch (error) {
    console.error('POST /api/carts/[customerId]/items error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
