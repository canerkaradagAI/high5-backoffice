
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/db';

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

    // Prevent disabling self
    if (id === session.user.id && existingUser.isActive) {
      return NextResponse.json(
        { error: 'Kendi hesabınızı pasif yapamazsınız' },
        { status: 400 }
      );
    }

    // Toggle user status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: !existingUser.isActive
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    // TODO: Log the action when Log model is added

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error toggling user status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
