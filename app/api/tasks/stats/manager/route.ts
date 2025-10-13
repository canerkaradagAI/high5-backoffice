import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Only managers should use this, but do not hard-enforce to keep things simple
    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role') || 'all'; // 'all' | 'Runner' | 'Satış Danışmanı'

    // Where helpers according to role
    const roleWhere: any = roleFilter === 'all' 
      ? {}
      : {
          OR: [
            { assignedTo: { userRoles: { some: { role: { name: roleFilter } } } } },
            { AND: [{ assignedToId: null }, { targetRole: roleFilter }] }
          ]
        };

    // Global status counts for tabs
    let pending: number, inProgress: number, completed: number, total: number, todayCompleted: number;
    if (roleFilter === 'all') {
      [pending, inProgress, completed, total, todayCompleted] = await Promise.all([
        prisma.task.count({ where: { OR: [{ status: 'Bekliyor' }, { status: 'PENDING' }] } }),
        prisma.task.count({ where: { OR: [{ status: 'Devam Ediyor' }, { status: 'ASSIGNED' }] } }),
        prisma.task.count({ where: { status: 'Tamamlandı' } }),
        prisma.task.count(),
        prisma.task.count({ where: { status: 'Tamamlandı', completedAt: { gte: todayStart, lte: todayEnd } } })
      ]);
    } else {
      [pending, inProgress, completed, total, todayCompleted] = await Promise.all([
        // Beklemede: sadece seçilen role hedeflenmiş ve atan(a)mamış
        prisma.task.count({ where: { assignedToId: null, targetRole: roleFilter, OR: [{ status: 'Bekliyor' }, { status: 'PENDING' }] } }),
        // Devam Ediyor: seçilen role atanmış ve tamamlanmamış
        prisma.task.count({ where: { assignedTo: { userRoles: { some: { role: { name: roleFilter } } } }, OR: [{ status: 'Devam Ediyor' }, { status: 'ASSIGNED' }] } }),
        // Tamamlandı: seçilen role açılmış olan tamamlananlar
        prisma.task.count({ where: { targetRole: roleFilter, status: 'Tamamlandı' } }),
        // Tümü: role atanmış olanlar + role hedeflenmiş olanlar
        prisma.task.count({ where: { OR: [ { assignedTo: { userRoles: { some: { role: { name: roleFilter } } } } }, { targetRole: roleFilter } ] } }),
        prisma.task.count({ where: { targetRole: roleFilter, status: 'Tamamlandı', completedAt: { gte: todayStart, lte: todayEnd } } })
      ]);
    }

    // Fetch users for both roles
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        userRoles: { select: { role: { select: { name: true } } } }
      }
    });

    const userIds = users.map(u => u.id);

    // Tasks per user (active and completed today)
    const [activePerUser, completedTodayPerUser, customersPerConsultant] = await Promise.all([
      prisma.task.groupBy({
        by: ['assignedToId'],
        _count: { assignedToId: true },
        where: {
          assignedToId: { in: userIds },
          status: { notIn: ['Tamamlandı', 'İptal'] },
          ...(roleFilter === 'all' ? {} : { assignedTo: { userRoles: { some: { role: { name: roleFilter } } } } })
        }
      }),
      prisma.task.groupBy({
        by: ['assignedToId'],
        _count: { assignedToId: true },
        where: {
          assignedToId: { in: userIds },
          status: 'Tamamlandı',
          completedAt: { gte: todayStart, lte: todayEnd },
          ...(roleFilter === 'all' ? {} : { assignedTo: { userRoles: { some: { role: { name: roleFilter } } } } })
        }
      }),
      prisma.customer.groupBy({
        by: ['assignedConsultantId'],
        _count: { assignedConsultantId: true },
        where: { assignedConsultantId: { in: userIds } }
      })
    ]);

    const activeMap = new Map<string, number>();
    activePerUser.forEach(r => { if (r.assignedToId) activeMap.set(r.assignedToId, r._count.assignedToId); });
    const completedTodayMap = new Map<string, number>();
    completedTodayPerUser.forEach(r => { if (r.assignedToId) completedTodayMap.set(r.assignedToId, r._count.assignedToId); });

    const runners: any[] = [];
    const consultants: any[] = [];

    users.forEach(u => {
      const roles = u.userRoles?.map(ur => ur.role.name) || [];
      const active = activeMap.get(u.id) || 0;
      const doneToday = completedTodayMap.get(u.id) || 0;
      const activeCustomerCount = customersPerConsultant.find(c => c.assignedConsultantId === u.id)?._count.assignedConsultantId || 0;
      const item = {
        id: u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'İsimsiz',
        activeCount: active,
        completedToday: doneToday,
        status: active > 0 ? 'Aktif' : 'Pasif',
        activeCustomers: activeCustomerCount
      };
      if (roles.includes('Runner')) runners.push(item);
      if (roles.includes('Satış Danışmanı')) consultants.push(item);
    });

    return NextResponse.json({
      statusCounts: { total, pending, inProgress, completed, todayCompleted },
      runners,
      consultants
    });
  } catch (error) {
    console.error('GET /api/tasks/stats/manager error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


