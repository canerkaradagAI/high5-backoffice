import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    if (!role) {
      return NextResponse.json({ error: 'role parametresi gerekli' }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: {
        userRoles: {
          some: { role: { name: role } }
        },
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      },
      orderBy: { firstName: 'asc' }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('GET /app/api/users/by-role error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
