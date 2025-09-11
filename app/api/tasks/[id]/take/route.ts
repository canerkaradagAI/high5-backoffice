import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.id;

    // Görevin mevcut olup olmadığını ve havuzda olup olmadığını kontrol et
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: true
      }
    });

    if (!task) {
      return NextResponse.json(
        { message: 'Görev bulunamadı' },
        { status: 404 }
      );
    }

    // Görev zaten atanmış mı kontrol et
    if (task.assignedToId) {
      return NextResponse.json(
        { message: 'Bu görev zaten atanmış' },
        { status: 400 }
      );
    }

    // Görev havuzunda değil mi kontrol et (status kontrolü)
    if (!['Bekliyor', 'PENDING'].includes(task.status)) {
      return NextResponse.json(
        { message: 'Bu görev havuzunda değil' },
        { status: 400 }
      );
    }

    // Görevi Runner'a ata
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        assignedToId: session.user.id,
        status: 'Devam Ediyor' // Görev alındığında otomatik olarak "Devam Ediyor" durumuna geç
      },
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
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ 
      task: updatedTask,
      message: 'Görev başarıyla alındı'
    });

  } catch (error) {
    console.error('POST /api/tasks/[id]/take error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
