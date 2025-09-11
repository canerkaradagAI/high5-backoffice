import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Tüm ürünleri listele
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search } },
        { brand: { contains: search, mode: 'insensitive' } }
      ],
      isActive: true
    } : { isActive: true };

    const products = await prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.product.count({ where });

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Yeni ürün ekle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const product = await prisma.product.create({
      data: {
        sku: body.sku,
        name: body.name,
        description: body.description,
        imageUrl: body.imageUrl,
        price: body.price,
        category: body.category,
        brand: body.brand,
        color: body.color,
        size: body.size,
        isActive: body.isActive !== false
      }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
