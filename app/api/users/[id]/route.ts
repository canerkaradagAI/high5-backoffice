
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/db';
import { z } from 'zod';

const updateUserSchema = z.object({
  firstName: z.string().min(1, 'Ad gereklidir'),
  lastName: z.string().min(1, 'Soyad gereklidir'),
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  phone: z.string().nullable().optional(),
  active: z.boolean().default(true),
  roleIds: z.array(z.string()).min(1, 'En az bir rol seçmelisiniz')
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const userPermissions = session?.user?.permissions ?? [];
    const hasPermission = userPermissions?.some(p => p?.name === 'Kullanıcı Yönetimi');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if email is taken by another user
    if (validatedData.email !== existingUser.email) {
      const emailTaken = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          id: { not: id }
        }
      });

      if (emailTaken) {
        return NextResponse.json(
          { error: 'Bu e-posta adresi zaten kullanılıyor' },
          { status: 400 }
        );
      }
    }

    // Update user with transaction
    const updatedUser = await prisma.$transaction(async (prisma) => {
      // First, delete existing roles
      await prisma.userRole.deleteMany({
        where: { userId: id }
      });

      // Then update user and create new roles
      const user = await prisma.user.update({
        where: { id },
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          phone: validatedData.phone,
          isActive: validatedData.active,
          userRoles: {
            create: validatedData.roleIds.map(roleId => ({
              role: {
                connect: { id: roleId }
              }
            }))
          }
        },
        include: {
          userRoles: {
            include: {
              role: true
            }
          }
        }
      });

      return user;
    });

    // TODO: Log the action when Log model is added

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const userPermissions = session?.user?.permissions ?? [];
    const hasPermission = userPermissions?.some(p => p?.name === 'Kullanıcı Yönetimi');
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deleting self
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Kendi hesabınızı silemezsiniz' },
        { status: 400 }
      );
    }

    // Delete user (roles will be deleted automatically due to cascade)
    await prisma.user.delete({
      where: { id }
    });

    // TODO: Log the action when Log model is added

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
