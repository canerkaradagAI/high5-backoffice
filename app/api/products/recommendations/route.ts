import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartItemIds = searchParams.get('cartItemIds');
    const limit = parseInt(searchParams.get('limit') || '6');

    if (!cartItemIds) {
      return NextResponse.json({ error: 'Cart item IDs required' }, { status: 400 });
    }

    const itemIds = cartItemIds.split(',').filter(Boolean);
    
    if (itemIds.length === 0) {
      // Sepet boşsa, popüler Skechers ürünlerini döndür
      const popularProducts = await prisma.product.findMany({
        where: { 
          isActive: true,
          brand: 'Skechers'
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          sku: true,
          name: true,
          description: true,
          imageUrl: true,
          price: true,
          category: true,
          brand: true,
          color: true,
          size: true
        }
      });

      return NextResponse.json({ recommendations: popularProducts });
    }

    // Sepetteki ürünleri al
    const cartItems = await prisma.cartItem.findMany({
      where: { id: { in: itemIds } },
      select: { sku: true, title: true }
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // Sepetteki ürünlerin kategorilerini ve markalarını al
    const cartProducts = await prisma.product.findMany({
      where: {
        sku: { in: cartItems.map(item => item.sku).filter(Boolean) }
      },
      select: { category: true, brand: true, color: true }
    });

    const categories = [...new Set(cartProducts.map(p => p.category).filter(Boolean))];
    const brands = [...new Set(cartProducts.map(p => p.brand).filter(Boolean))];
    const colors = [...new Set(cartProducts.map(p => p.color).filter(Boolean))];

    // Öneriler algoritması
    let recommendations = [];

    // 1. Aynı marka, farklı kategori (sadece Skechers)
    if (brands.length > 0) {
      const sameBrandRecs = await prisma.product.findMany({
        where: {
          brand: 'Skechers',
          isActive: true,
          sku: { notIn: cartItems.map(item => item.sku).filter(Boolean) }
        },
        take: Math.ceil(limit / 2),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          sku: true,
          name: true,
          description: true,
          imageUrl: true,
          price: true,
          category: true,
          brand: true,
          color: true,
          size: true
        }
      });
      recommendations.push(...sameBrandRecs);
    }

    // 2. Aynı kategori, farklı renk/boyut (sadece Skechers)
    if (categories.length > 0 && recommendations.length < limit) {
      const sameCategoryRecs = await prisma.product.findMany({
        where: {
          category: { in: categories },
          brand: 'Skechers',
          isActive: true,
          sku: { notIn: cartItems.map(item => item.sku).filter(Boolean) }
        },
        take: Math.ceil(limit / 2),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          sku: true,
          name: true,
          description: true,
          imageUrl: true,
          price: true,
          category: true,
          brand: true,
          color: true,
          size: true
        }
      });
      recommendations.push(...sameCategoryRecs);
    }

    // 3. Eğer hala yeterli öneri yoksa, genel popüler Skechers ürünleri
    if (recommendations.length < limit) {
      const popularRecs = await prisma.product.findMany({
        where: {
          brand: 'Skechers',
          isActive: true,
          sku: { notIn: cartItems.map(item => item.sku).filter(Boolean) }
        },
        take: limit - recommendations.length,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          sku: true,
          name: true,
          description: true,
          imageUrl: true,
          price: true,
          category: true,
          brand: true,
          color: true,
          size: true
        }
      });
      recommendations.push(...popularRecs);
    }

    // Duplikatları kaldır ve limit uygula
    const uniqueRecommendations = recommendations.filter((product, index, self) => 
      index === self.findIndex(p => p.sku === product.sku)
    ).slice(0, limit);

    return NextResponse.json({ recommendations: uniqueRecommendations });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
