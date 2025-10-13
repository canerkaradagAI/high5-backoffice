import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Rol kontrolü - sadece Mağaza Müdürü
    const userRoles = (session.user as any)?.roles || [];
    const isManager = userRoles.some((r: any) => r?.name === 'Mağaza Müdürü');
    
    if (!isManager) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    const taskDefinition = await prisma.taskDefinition.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!taskDefinition) {
      return NextResponse.json({ error: 'Task definition not found' }, { status: 404 });
    }

    return NextResponse.json(taskDefinition);
  } catch (error) {
    console.error('Error fetching task definition:', error);
    return NextResponse.json({ error: 'Failed to fetch task definition' }, { status: 500 });
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

    // Rol kontrolü - sadece Mağaza Müdürü
    const userRoles = (session.user as any)?.roles || [];
    const isManager = userRoles.some((r: any) => r?.name === 'Mağaza Müdürü');
    
    if (!isManager) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { name, description, role, requiresProductCode, isActive } = body;

    // Görev tanımının var olduğunu kontrol et
    const existingTask = await prisma.taskDefinition.findUnique({
      where: { id }
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task definition not found' }, { status: 404 });
    }

    // Eğer isim veya rol değişiyorsa, benzersizlik kontrolü yap
    if (name && name !== existingTask.name || role && role !== existingTask.role) {
      const duplicateTask = await prisma.taskDefinition.findUnique({
        where: {
          name_role: {
            name: name || existingTask.name,
            role: role || existingTask.role
          }
        }
      });

      if (duplicateTask && duplicateTask.id !== id) {
        return NextResponse.json({ message: 'Bu rol için aynı isimde görev zaten mevcut' }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (role !== undefined) updateData.role = role.trim();
    if (requiresProductCode !== undefined) updateData.requiresProductCode = Boolean(requiresProductCode);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const taskDefinition = await prisma.taskDefinition.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json(taskDefinition);
  } catch (error) {
    console.error('Error updating task definition:', error);
    return NextResponse.json({ error: 'Failed to update task definition' }, { status: 500 });
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

    // Rol kontrolü - sadece Mağaza Müdürü
    const userRoles = (session.user as any)?.roles || [];
    const isManager = userRoles.some((r: any) => r?.name === 'Mağaza Müdürü');
    
    if (!isManager) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    // Görev tanımının var olduğunu kontrol et
    const existingTask = await prisma.taskDefinition.findUnique({
      where: { id }
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task definition not found' }, { status: 404 });
    }

    // Bu görev tanımını kullanan aktif görevler var mı kontrol et
    const activeTasks = await prisma.task.count({
      where: {
        type: existingTask.name,
        status: { in: ['Bekliyor', 'Devam Ediyor'] }
      }
    });

    if (activeTasks > 0) {
      return NextResponse.json({ 
        message: `Bu görev tanımını kullanan ${activeTasks} aktif görev bulunuyor. Önce bu görevleri tamamlayın veya iptal edin.` 
      }, { status: 400 });
    }

    await prisma.taskDefinition.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Task definition deleted successfully' });
  } catch (error) {
    console.error('Error deleting task definition:', error);
    return NextResponse.json({ error: 'Failed to delete task definition' }, { status: 500 });
  }
}
