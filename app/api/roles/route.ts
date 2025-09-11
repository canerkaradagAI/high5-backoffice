
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
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const includePermissions = searchParams.get('includePermissions') === 'true';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const includeOptions: any = {
      _count: {
        select: {
          userRoles: { where: { isActive: true } },
          rolePermissions: { where: { isActive: true } }
        }
      }
    };

    if (includePermissions) {
      includeOptions.rolePermissions = {
        where: { isActive: true },
        include: {
          permission: true
        }
      };
    }

    const [roles, totalCount] = await Promise.all([
      prisma.role.findMany({
        where,
        skip,
        take: limit,
        include: includeOptions,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.role.count({ where })
    ]);

    return NextResponse.json({
      roles,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('GET /api/roles error:', error);
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
    const { name, description, permissions = [] } = body;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { message: 'Rol adı zorunludur' },
        { status: 400 }
      );
    }

    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: name.trim() }
    });

    if (existingRole) {
      return NextResponse.json(
        { message: 'Bu rol adı zaten mevcut' },
        { status: 400 }
      );
    }

    // Create role with permissions
    const role = await prisma.role.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        rolePermissions: {
          create: permissions.map((permissionId: string) => ({
            permissionId
          }))
        }
      },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            userRoles: { where: { isActive: true } },
            rolePermissions: { where: { isActive: true } }
          }
        }
      }
    });

    return NextResponse.json({ role }, { status: 201 });

  } catch (error) {
    console.error('POST /api/roles error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
