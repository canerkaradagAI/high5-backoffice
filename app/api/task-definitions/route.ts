import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('🔍 Task Definitions API - Session:', session?.user?.email);
    
    if (!session?.user) {
      console.log('❌ Task Definitions API - No session');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Rol kontrolü - Mağaza Müdürü ve Satış Danışmanı erişebilir
    const userRoles = (session.user as any)?.roles || [];
    console.log('🔍 Task Definitions API - User roles:', userRoles);
    const isManager = userRoles.some((r: any) => r?.name === 'Mağaza Müdürü');
    const isSalesConsultant = userRoles.some((r: any) => r?.name === 'Satış Danışmanı');
    const hasAccess = isManager || isSalesConsultant;
    console.log('🔍 Task Definitions API - Is manager:', isManager);
    console.log('🔍 Task Definitions API - Is sales consultant:', isSalesConsultant);
    console.log('🔍 Task Definitions API - Has access:', hasAccess);
    
    if (!hasAccess) {
      console.log('❌ Task Definitions API - No access');
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const taskDefinitions = await prisma.taskDefinition.findMany({
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json(taskDefinitions);
  } catch (error) {
    console.error('Error fetching task definitions:', error);
    return NextResponse.json({ error: 'Failed to fetch task definitions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Rol kontrolü - Mağaza Müdürü ve Satış Danışmanı erişebilir
    const userRoles = (session.user as any)?.roles || [];
    const isManager = userRoles.some((r: any) => r?.name === 'Mağaza Müdürü');
    const isSalesConsultant = userRoles.some((r: any) => r?.name === 'Satış Danışmanı');
    const hasAccess = isManager || isSalesConsultant;
    
    if (!hasAccess) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, role, requiresProductCode } = body;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({ message: 'Görev adı zorunludur' }, { status: 400 });
    }

    if (!role?.trim()) {
      return NextResponse.json({ message: 'Rol zorunludur' }, { status: 400 });
    }

    // Aynı rol için aynı isimde görev var mı kontrol et
    const existingTask = await prisma.taskDefinition.findUnique({
      where: {
        name_role: {
          name: name.trim(),
          role: role.trim()
        }
      }
    });

    if (existingTask) {
      return NextResponse.json({ message: 'Bu rol için aynı isimde görev zaten mevcut' }, { status: 400 });
    }

    const taskDefinition = await prisma.taskDefinition.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        role: role.trim(),
        requiresProductCode: Boolean(requiresProductCode),
        createdById: session.user.id
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json(taskDefinition, { status: 201 });
  } catch (error) {
    console.error('Error creating task definition:', error);
    return NextResponse.json({ error: 'Failed to create task definition' }, { status: 500 });
  }
}
