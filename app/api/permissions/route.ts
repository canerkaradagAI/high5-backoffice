
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100'); // Higher default for permissions
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [permissions, totalCount] = await Promise.all([
      prisma.permission.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              rolePermissions: { where: { isActive: true } }
            }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.permission.count({ where })
    ]);

    return NextResponse.json({
      permissions,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('GET /api/permissions error:', error);
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
    const { name, description } = body;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { message: 'İzin adı zorunludur' },
        { status: 400 }
      );
    }

    // Check if permission name already exists
    const existingPermission = await prisma.permission.findUnique({
      where: { name: name.trim() }
    });

    if (existingPermission) {
      return NextResponse.json(
        { message: 'Bu izin adı zaten mevcut' },
        { status: 400 }
      );
    }

    const permission = await prisma.permission.create({
      data: {
        name: name.trim(),
        description: description?.trim()
      },
      include: {
        _count: {
          select: {
            rolePermissions: { where: { isActive: true } }
          }
        }
      }
    });

    return NextResponse.json({ permission }, { status: 201 });

  } catch (error) {
    console.error('POST /api/permissions error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
