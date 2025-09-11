import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku');
    const barcode = searchParams.get('barcode');

    if (!sku && !barcode) {
      return NextResponse.json({ error: 'SKU or barcode required' }, { status: 400 });
    }

    const searchTerm = sku || barcode;
    
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: searchTerm },
          { name: { contains: searchTerm, mode: 'insensitive' } }
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
