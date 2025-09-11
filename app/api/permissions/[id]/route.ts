
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

    const permission = await prisma.permission.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            rolePermissions: { where: { isActive: true } }
          }
        }
      }
    });

    if (!permission) {
      return NextResponse.json(
        { message: 'İzin bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ permission });

  } catch (error) {
    console.error('GET /api/permissions/[id] error:', error);
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
    const { name, description } = body;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { message: 'İzin adı zorunludur' },
        { status: 400 }
      );
    }

    const existingPermission = await prisma.permission.findUnique({
      where: { id: params.id }
    });

    if (!existingPermission) {
      return NextResponse.json(
        { message: 'İzin bulunamadı' },
        { status: 404 }
      );
    }

    // Check if permission name already exists (excluding current permission)
    const duplicateName = await prisma.permission.findUnique({
      where: { name: name.trim() }
    });

    if (duplicateName && duplicateName.id !== params.id) {
      return NextResponse.json(
        { message: 'Bu izin adı zaten mevcut' },
        { status: 400 }
      );
    }

    const permission = await prisma.permission.update({
      where: { id: params.id },
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

    return NextResponse.json({ permission });

  } catch (error) {
    console.error('PUT /api/permissions/[id] error:', error);
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

    const existingPermission = await prisma.permission.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            rolePermissions: { where: { isActive: true } }
          }
        }
      }
    });

    if (!existingPermission) {
      return NextResponse.json(
        { message: 'İzin bulunamadı' },
        { status: 404 }
      );
    }

    // Check if permission is being used by any roles
    if (existingPermission._count.rolePermissions > 0) {
      return NextResponse.json(
        { message: 'Bu izin rollere atanmış olduğu için silinemez' },
        { status: 400 }
      );
    }

    // Soft delete
    await prisma.permission.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    return NextResponse.json({ 
      message: 'İzin başarıyla silindi' 
    });

  } catch (error) {
    console.error('DELETE /api/permissions/[id] error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
