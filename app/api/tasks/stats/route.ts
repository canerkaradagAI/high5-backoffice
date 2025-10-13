
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'requests'; // 'mine' | 'requests' | 'all'
    const isMine = scope === 'mine';
    const isAll = scope === 'all';

    const whereMine = { assignedToId: session.user.id } as any;
    const whereRequests = { createdById: session.user.id } as any;
    const whereAll = {} as any;
    const scopeWhere = isAll ? whereAll : isMine ? whereMine : whereRequests;

    const [
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTask,
      priorityStats,
      typeStats,
      assignmentStats
    ] = await Promise.all([
      // Total tasks
      prisma.task.count({ where: scopeWhere }),
      
      // Pending tasks
      prisma.task.count({ where: { ...scopeWhere, OR: [{ status: 'Bekliyor' }, { status: 'PENDING' }] } }),
      
      // In progress tasks
      prisma.task.count({
        where: {
          ...scopeWhere,
          OR: [
            { status: 'Devam Ediyor' },
            { status: 'ASSIGNED' }
          ]
        }
      }),
      
      // Completed tasks
      prisma.task.count({ where: { ...scopeWhere, status: 'Tamamlandı' } }),
      
      // Overdue tasks
      prisma.task.count({
        where: {
          ...scopeWhere,
          dueDate: { lt: new Date() },
          status: { notIn: ['Tamamlandı', 'İptal'] }
        }
      }),
      
      // Priority stats
      prisma.task.groupBy({
        by: ['priority'],
        _count: { priority: true },
        where: scopeWhere
      }),
      
      // Type stats
      prisma.task.groupBy({
        by: ['type'],
        _count: { type: true },
        orderBy: { _count: { type: 'desc' } },
        where: scopeWhere
      }),
      
      // Assignment stats
      prisma.task.groupBy({
        by: ['assignedToId'],
        _count: { assignedToId: true },
        where: { ...scopeWhere, assignedToId: { not: null } }
      })
    ]);

    // Get user details for assignment stats
    const assignedUserIds = assignmentStats
      .map(stat => stat.assignedToId)
      .filter((id): id is string => id !== null);
    const assignedUsers = await prisma.user.findMany({
      where: { id: { in: assignedUserIds } },
      select: { id: true, firstName: true, lastName: true }
    });

    const assignmentStatsWithUsers = assignmentStats.map(stat => {
      const user = assignedUsers.find(u => u.id === stat.assignedToId);
      return {
        userId: stat.assignedToId,
        userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'İsimsiz' : 'Bilinmeyen',
        taskCount: stat._count.assignedToId
      };
    });

    const stats = {
      summary: {
        total: totalTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks,
        completed: completedTasks,
        overdue: overdueTask,
        today: totalTasks,
        thisWeek: 0
      },
      priority: priorityStats.map(stat => ({
        priority: stat.priority,
        count: stat._count.priority
      })),
      type: typeStats.map(stat => ({
        type: stat.type,
        count: stat._count.type
      })),
      assignment: assignmentStatsWithUsers
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('GET /api/tasks/stats error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
