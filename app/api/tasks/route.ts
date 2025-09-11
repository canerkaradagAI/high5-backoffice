
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
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const assignedTo = searchParams.get('assignedTo') || '';
    const scope = searchParams.get('scope') || ''; // 'mine' (assigned to me) or 'requests' (created by me)

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    // Scope filter
    if (scope === 'mine') {
      where.assignedToId = session.user.id;
    } else if (scope === 'requests') {
      where.createdById = session.user.id;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { customer: { fullName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (status && status !== 'all') {
      if (status === 'Devam Ediyor') {
        // Kartlardaki mantıkla birebir: Devam Eden → status ∈ { 'Devam Ediyor', 'ASSIGNED' }
        where.OR = [{ status: 'Devam Ediyor' }, { status: 'ASSIGNED' }];
      } else if (status === 'Tamamlandı' || status === 'Tamamlanan') {
        where.OR = [{ status: 'Tamamlandı' }, { status: 'COMPLETED' }];
      } else if (status === 'Bekliyor') {
        where.OR = [{ status: 'Bekliyor' }, { status: 'PENDING' }];
        if (scope === 'requests') {
          (where.AND ||= []).push({ assignedToId: null });
        }
      } else {
        where.status = status;
      }
    }

    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    if (assignedTo && assignedTo !== 'all') {
      where.assignedToId = assignedTo;
    }

    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
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
        },
        orderBy: { createdAt: 'desc' }
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
    console.error('GET /api/tasks error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
      priority = 'medium',
      status = 'PENDING',
      dueDate,
      assignedTo,
      customerId,
      notes
    } = body;

    // Validation
    if (!title?.trim()) {
      return NextResponse.json(
        { message: 'Görev başlığı zorunludur' },
        { status: 400 }
      );
    }

    if (!type?.trim()) {
      return NextResponse.json(
        { message: 'Görev türü zorunludur' },
        { status: 400 }
      );
    }

    if (!priority) {
      return NextResponse.json(
        { message: 'Aciliyet seviyesi zorunludur' },
        { status: 400 }
      );
    }

    // assignedTo guard: sadece geçerli bir kullanıcı ID'si ise ata; aksi halde havuza düşür
    let safeAssignedToId: string | null = null;
    if (assignedTo && typeof assignedTo === 'string') {
      try {
        const user = await prisma.user.findUnique({ where: { id: assignedTo } });
        if (user) {
          safeAssignedToId = assignedTo;
        }
      } catch {}
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim(),
        type: type.trim(),
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedToId: safeAssignedToId,
        customerId,
        notes: notes?.trim(),
        createdById: session.user.id
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
            lastName: true
          }
        }
      }
    });

    return NextResponse.json({ task }, { status: 201 });

  } catch (error) {
    console.error('POST /api/tasks error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
