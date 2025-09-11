
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const role = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        rolePermissions: {
          where: { isActive: true },
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

    if (!role) {
      return NextResponse.json(
        { message: 'Rol bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ role });

  } catch (error) {
    console.error('GET /api/roles/[id] error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const existingRole = await prisma.role.findUnique({
      where: { id: params.id }
    });

    if (!existingRole) {
      return NextResponse.json(
        { message: 'Rol bulunamadı' },
        { status: 404 }
      );
    }

    // Check if role name already exists (excluding current role)
    const duplicateName = await prisma.role.findUnique({
      where: { name: name.trim() }
    });

    if (duplicateName && duplicateName.id !== params.id) {
      return NextResponse.json(
        { message: 'Bu rol adı zaten mevcut' },
        { status: 400 }
      );
    }

    // Update role with permissions
    const role = await prisma.role.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        description: description?.trim(),
        rolePermissions: {
          deleteMany: {},
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

    return NextResponse.json({ role });

  } catch (error) {
    console.error('PUT /api/roles/[id] error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const existingRole = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            userRoles: { where: { isActive: true } }
          }
        }
      }
    });

    if (!existingRole) {
      return NextResponse.json(
        { message: 'Rol bulunamadı' },
        { status: 404 }
      );
    }

    // Check if role is being used by any users
    if (existingRole._count.userRoles > 0) {
      return NextResponse.json(
        { message: 'Bu rol kullanıcılara atanmış olduğu için silinemez' },
        { status: 400 }
      );
    }

    // Soft delete
    await prisma.role.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    return NextResponse.json({ 
      message: 'Rol başarıyla silindi' 
    });

  } catch (error) {
    console.error('DELETE /api/roles/[id] error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
