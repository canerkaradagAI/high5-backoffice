
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
    const assigneeRole = searchParams.get('assigneeRole') || 'all'; // Manager role filter

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

    // Manager: role-aware filtering according to clarified rules
    if (assigneeRole && assigneeRole !== 'all') {
      const roleMatchAssigned = { assignedTo: { userRoles: { some: { role: { name: assigneeRole } } } } } as any;
      const roleMatchTarget = { targetRole: assigneeRole } as any;

      if (status === 'Bekliyor') {
        // Runner/SD için açılmış ama atan(a)mamış bekleyenler
        (where.AND ||= []).push({ assignedToId: null, ...roleMatchTarget });
      } else if (status === 'Devam Ediyor') {
        // Seçilen role atanmış ve tamamlanmamış
        (where.AND ||= []).push(roleMatchAssigned);
      } else if (status === 'Tamamlandı' || status === 'Tamamlanan') {
        // Seçilen role açılmış ve tamamlanmış
        (where.AND ||= []).push(roleMatchTarget);
      } else {
        // Tümü: role atanmış olanlar + o role açılanlar (birlikte)
        (where.AND ||= []).push({ OR: [roleMatchAssigned, roleMatchTarget] });
      }
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
              email: true,
              userRoles: { select: { role: { select: { name: true } } } }
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
      notes,
      deliveryLocation,
      targetRole,
      productCode
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

    // AUTO_TASK_ASSIGNMENT parametresini kontrol et
    const autoAssignmentParam = await prisma.parameter.findFirst({
      where: { key: 'AUTO_TASK_ASSIGNMENT' }
    });

    const isAutoAssignmentEnabled = autoAssignmentParam?.value === 'true';

    // assignedTo guard: sadece geçerli bir kullanıcı ID'si ise ata; aksi halde havuza düşür
    let safeAssignedToId: string | null = null;
    let finalStatus = status;

    if (assignedTo && typeof assignedTo === 'string') {
      try {
        const user = await prisma.user.findUnique({ where: { id: assignedTo } });
        if (user) {
          safeAssignedToId = assignedTo;
        }
      } catch {}
    }

    // Otomatik atama: Sadece Runner rolü için ve targetRole Runner ise
    if (isAutoAssignmentEnabled && !safeAssignedToId && targetRole === 'Runner') {
      try {
        // En az iş yüküne sahip aktif Runner'ı bul
        const runners = await prisma.user.findMany({
          where: {
            isActive: true,
            userRoles: {
              some: {
                role: { name: 'Runner' },
                isActive: true
              }
            }
          },
          include: {
            assignedTasks: {
              where: { 
                status: { in: ['Devam Ediyor', 'ASSIGNED'] }
              },
              select: { id: true }
            }
          }
        });

        // En az görevi olan Runner'ı bul
        const leastBusyRunner = runners.reduce((min, runner) => 
          runner.assignedTasks.length < min.assignedTasks.length ? runner : min
        );

        if (leastBusyRunner) {
          safeAssignedToId = leastBusyRunner.id;
          finalStatus = 'Devam Ediyor'; // Otomatik atanan görevler direkt "Devam Ediyor" durumuna geçer
          console.log(`🤖 Otomatik atama: ${title} → ${leastBusyRunner.firstName} ${leastBusyRunner.lastName} (${leastBusyRunner.assignedTasks.length} aktif görev)`);
        }
      } catch (error) {
        console.error('Otomatik atama hatası:', error);
        // Hata durumunda görev havuzda kalır
      }
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim(),
        type: type.trim(),
        priority,
        status: finalStatus,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedToId: safeAssignedToId,
        customerId,
        notes: notes?.trim(),
        deliveryLocation: deliveryLocation?.trim(),
        targetRole: targetRole?.trim(),
        productCode: productCode?.trim(),
        createdById: session.user.id
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            userRoles: { select: { role: { select: { name: true } } } }
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
