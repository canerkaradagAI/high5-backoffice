import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku');
    const barcode = searchParams.get('barcode');

    const searchTerm = (sku || barcode || '').trim();
    if (!searchTerm) {
      return NextResponse.json({ error: 'SKU or barcode required' }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: searchTerm },
          { name: { contains: searchTerm } }
        ],
        isActive: true
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error searching product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}