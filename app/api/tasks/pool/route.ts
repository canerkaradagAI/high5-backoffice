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
    const priority = searchParams.get('priority') || '';

    const skip = (page - 1) * limit;

    // Kullanıcının rolünü al
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    const userRole = user?.userRoles?.[0]?.role?.name || 'Kullanıcı';

    // Görev havuzu: assignedToId null olan ve hedef rol eşleşen görevler
    const where: any = {
      assignedToId: null,
      status: {
        in: ['Bekliyor', 'PENDING'] // Sadece bekleyen görevler
      },
      // Rol bazlı filtreleme: targetRole null ise tüm roller görebilir, değilse sadece hedef rol
      OR: [
        { targetRole: null }, // targetRole belirtilmemiş görevler
        { targetRole: userRole } // Kullanıcının rolü ile eşleşen görevler
      ]
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { customer: { fullName: { contains: search, mode: 'insensitive' } } }
          ]
        }
      ];
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
    console.error('GET /api/tasks/pool error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
