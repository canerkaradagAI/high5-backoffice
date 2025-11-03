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

    // Satış Danışmanı için özel görev havuzu
    // targetRole = 'Satış Danışmanı' olan ve assignedToId null olan görevler
    const where: any = {
      assignedToId: null,
      targetRole: 'Satış Danışmanı',
      status: {
        in: ['Bekliyor', 'PENDING']
      }
    };

    const tasks = await prisma.task.findMany({
      where,
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
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('GET /api/tasks/consultant-pool error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

