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
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';

    const skip = (page - 1) * limit;

    // Runner'ın kendi görevleri: assignedToId = session.user.id
    const where: any = {
      assignedToId: session.user.id
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { customer: { fullName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (status && status !== 'all') {
      if (status === 'Devam Ediyor') {
        where.OR = [{ status: 'Devam Ediyor' }, { status: 'ASSIGNED' }];
      } else if (status === 'Tamamlandı' || status === 'Tamamlanan') {
        where.OR = [{ status: 'Tamamlandı' }, { status: 'COMPLETED' }];
      } else if (status === 'Bekliyor') {
        where.OR = [{ status: 'Bekliyor' }, { status: 'PENDING' }];
      } else {
        where.status = status;
      }
    }

    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          priority: true,
          status: true,
          dueDate: true,
          createdAt: true,
          completedAt: true,
          deliveryLocation: true,
          productCode: true,
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
        },
        orderBy: [
          { priority: 'desc' }, // Acil, Yüksek, Normal, Düşük sırası
          { createdAt: 'desc' }
        ]
      }),
      prisma.task.count({ where })
    ]);

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('GET /api/tasks/my error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
