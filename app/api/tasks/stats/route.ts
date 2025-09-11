
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
    const scope = searchParams.get('scope') || 'requests'; // 'mine' | 'requests'
    const isMine = scope === 'mine';

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
      isMine
        ? prisma.task.count({ where: { assignedToId: session.user.id } })
        : prisma.task.count({ where: { createdById: session.user.id } }),
      
      // Pending tasks: not assigned, created by current user
      isMine
        ? prisma.task.count({ where: { assignedToId: session.user.id, OR: [{ status: 'Bekliyor' }, { status: 'PENDING' }] } })
        : prisma.task.count({ where: { createdById: session.user.id, assignedToId: null, OR: [{ status: 'Bekliyor' }, { status: 'PENDING' }] } }),
      
      // In progress tasks: assigned (runner'a atanmış), not completed, created by current user
      isMine
        ? prisma.task.count({ where: { assignedToId: session.user.id, OR: [{ status: 'Devam Ediyor' }, { status: 'ASSIGNED' }] } })
        : prisma.task.count({
            where: {
              createdById: session.user.id,
              OR: [
                { status: 'Devam Ediyor' },
                { status: 'ASSIGNED' }
              ]
            }
          }),
      
      // Completed tasks: marked completed by runner, created by current user
      isMine
        ? prisma.task.count({ where: { assignedToId: session.user.id, status: 'Tamamlandı' } })
        : prisma.task.count({ where: { createdById: session.user.id, status: 'Tamamlandı' } }),
      
      // Overdue tasks (for current user)
      prisma.task.count({
        where: {
          ...(isMine ? { assignedToId: session.user.id } : { createdById: session.user.id }),
          dueDate: { lt: new Date() },
          status: { notIn: ['Tamamlandı', 'İptal'] }
        }
      }),
      
      // Priority stats (current user's tasks)
      prisma.task.groupBy({
        by: ['priority'],
        _count: { priority: true },
        where: { ...(isMine ? { assignedToId: session.user.id } : { createdById: session.user.id }) }
      }),
      
      // Type stats (current user's tasks)
      prisma.task.groupBy({
        by: ['type'],
        _count: { type: true },
        orderBy: { _count: { type: 'desc' } },
        where: { ...(isMine ? { assignedToId: session.user.id } : { createdById: session.user.id }) }
      }),
      
      // Assignment stats (current user's tasks)
      prisma.task.groupBy({
        by: ['assignedToId'],
        _count: { assignedToId: true },
        where: { assignedToId: { not: null }, ...(isMine ? { assignedToId: session.user.id } : { createdById: session.user.id }) }
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
