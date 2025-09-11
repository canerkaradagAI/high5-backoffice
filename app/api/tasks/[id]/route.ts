
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

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            phone: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json(
        { message: 'Görev bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ task });

  } catch (error) {
    console.error('GET /api/tasks/[id] error:', error);
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
    const { 
      title, 
      description, 
      type, 
      priority,
      status,
      dueDate,
      assignedToId,
      customerId,
      notes,
      completedAt
    } = body;

    const existingTask = await prisma.task.findUnique({
      where: { id: params.id }
    });

    if (!existingTask) {
      return NextResponse.json(
        { message: 'Görev bulunamadı' },
        { status: 404 }
      );
    }

    // İptal kuralı: Runner'a atanmış görev iptal edilemez
    if (status === 'İptal' && existingTask.assignedToId) {
      return NextResponse.json(
        { message: 'Runner\'a atanmış görev iptal edilemez' },
        { status: 400 }
      );
    }

    // Kısmi güncelleme: Gönderilmeyen alanlar mevcut değerleri korur
    const updateData: any = {
      title: title?.trim() ?? existingTask.title,
      description: description ?? existingTask.description,
      type: type?.trim() ?? existingTask.type,
      priority: priority ?? existingTask.priority,
      status: status ?? existingTask.status,
      dueDate: dueDate ? new Date(dueDate) : existingTask.dueDate,
      assignedToId: assignedToId ?? existingTask.assignedToId,
      customerId: customerId ?? existingTask.customerId,
      notes: typeof notes === 'string' ? notes.trim() : existingTask.notes,
    };

    // Tamamlama tarihi yönetimi
    if (updateData.status === 'Tamamlandı' && existingTask.status !== 'Tamamlandı') {
      updateData.completedAt = new Date();
    } else if (updateData.status !== 'Tamamlandı') {
      updateData.completedAt = null;
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        customer: { select: { id: true, firstName: true, lastName: true, fullName: true, phone: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    return NextResponse.json({ task });

  } catch (error) {
    console.error('PUT /api/tasks/[id] error:', error);
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

    const existingTask = await prisma.task.findUnique({
      where: { id: params.id }
    });

    if (!existingTask) {
      return NextResponse.json(
        { message: 'Görev bulunamadı' },
        { status: 404 }
      );
    }

    // Kurallar:
    // - Runner'a atanmış görev SİLİNEMEZ
    // - Silme sadece assignedToId null iken (havuzda) mümkün
    if (existingTask.assignedToId) {
      return NextResponse.json(
        { message: 'Runner\'a atanmış görev silinemez' },
        { status: 400 }
      );
    }

    await prisma.task.delete({ where: { id: params.id } });

    return NextResponse.json({ 
      message: 'Görev başarıyla silindi' 
    });

  } catch (error) {
    console.error('DELETE /api/tasks/[id] error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
