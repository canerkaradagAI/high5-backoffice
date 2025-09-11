import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';

export async function GET(_request: NextRequest) {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: null,
        OR: Array.from({ length: 6 }).map((_, i) => ({ type: `tablet_wait_${100 + i}` }))
      },
      include: {
        customer: {
          select: { id: true, fullName: true, phone: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('GET /app/api/tasks/consultant-pool error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
