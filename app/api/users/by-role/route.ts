import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roleName = searchParams.get('roleName') || searchParams.get('role');

    if (!roleName) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    const role = await prisma.role.findFirst({
      where: { name: roleName },
    });

    if (!role) {
      return NextResponse.json({ error: `Role '${roleName}' not found` }, { status: 404 });
    }

    const parameter = await prisma.parameter.findUnique({
      where: { key: 'max_customers_per_consultant' }
    });
    const MAX_CUSTOMERS_PER_CONSULTANT = parameter ? parseInt(parameter.value) : 2;

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        userRoles: {
          some: {
            roleId: role.id,
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        consultingCustomers: {
          select: { id: true }
        }
      },
      orderBy: {
        firstName: 'asc',
      },
    });

    const usersWithCustomerCount = users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      customerCount: user.consultingCustomers.length,
      maxCustomers: MAX_CUSTOMERS_PER_CONSULTANT
    }));

    return NextResponse.json(usersWithCustomerCount);
  } catch (error) {
    console.error('Error fetching users by role:', error);
    return NextResponse.json({ error: 'Failed to fetch users by role' }, { status: 500 });
  }
}
