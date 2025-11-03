
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const type = searchParams.get('type') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { value: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    where.isActive = true;

    const [parameters, totalCount] = await Promise.all([
      prisma.parameter.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { category: 'asc' },
          { key: 'asc' }
        ]
      }),
      prisma.parameter.count({ where })
    ]);

    return NextResponse.json({
      parameters,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('GET /api/parameters error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      key, 
      value, 
      type = 'STRING',
      description,
      category = 'SYSTEM'
    } = body;

    // Validation
    if (!key?.trim()) {
      return NextResponse.json(
        { message: 'Parametre anahtarı zorunludur' },
        { status: 400 }
      );
    }

    if (!value?.trim()) {
      return NextResponse.json(
        { message: 'Parametre değeri zorunludur' },
        { status: 400 }
      );
    }

    // Check if key already exists
    const existingParameter = await prisma.parameter.findUnique({
      where: { key: key.trim().toUpperCase() }
    });

    if (existingParameter) {
      return NextResponse.json(
        { message: 'Bu parametre anahtarı zaten mevcut' },
        { status: 400 }
      );
    }

    // Validate type and value
    let validatedValue = value.trim();
    if (type === 'NUMBER') {
      if (isNaN(Number(validatedValue))) {
        return NextResponse.json(
          { message: 'Geçersiz sayı değeri' },
          { status: 400 }
        );
      }
    } else if (type === 'BOOLEAN') {
      if (!['true', 'false'].includes(validatedValue.toLowerCase())) {
        return NextResponse.json(
          { message: 'Boolean değer true veya false olmalıdır' },
          { status: 400 }
        );
      }
    } else if (type === 'JSON') {
      try {
        JSON.parse(validatedValue);
      } catch {
        return NextResponse.json(
          { message: 'Geçersiz JSON formatı' },
          { status: 400 }
        );
      }
    }

    const parameter = await prisma.parameter.create({
      data: {
        key: key.trim().toUpperCase(),
        value: validatedValue,
        type,
        description: description?.trim(),
        category
      }
    });

    return NextResponse.json({ parameter }, { status: 201 });

  } catch (error) {
    console.error('POST /api/parameters error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
