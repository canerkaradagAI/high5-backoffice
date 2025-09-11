
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const parameter = await prisma.parameter.findUnique({
      where: { id: params.id }
    });

    if (!parameter) {
      return NextResponse.json(
        { message: 'Parametre bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ parameter });

  } catch (error) {
    console.error('GET /api/parameters/[id] error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      key, 
      value, 
      type,
      description,
      category
    } = body;

    // Validation
    if (!key?.trim()) {
      return NextResponse.json(
        { message: 'Parametre anahtarı zorunludur' },
        { status: 400 }
      );
    }

    if (!value?.trim()) {
      return NextResponse.json(
        { message: 'Parametre değeri zorunludur' },
        { status: 400 }
      );
    }

    const existingParameter = await prisma.parameter.findUnique({
      where: { id: params.id }
    });

    if (!existingParameter) {
      return NextResponse.json(
        { message: 'Parametre bulunamadı' },
        { status: 404 }
      );
    }

    // Check if key already exists (excluding current parameter)
    const duplicateKey = await prisma.parameter.findUnique({
      where: { key: key.trim().toUpperCase() }
    });

    if (duplicateKey && duplicateKey.id !== params.id) {
      return NextResponse.json(
        { message: 'Bu parametre anahtarı zaten mevcut' },
        { status: 400 }
      );
    }

    // Validate type and value
    let validatedValue = value.trim();
    if (type === 'NUMBER') {
      if (isNaN(Number(validatedValue))) {
        return NextResponse.json(
          { message: 'Geçersiz sayı değeri' },
          { status: 400 }
        );
      }
    } else if (type === 'BOOLEAN') {
      if (!['true', 'false'].includes(validatedValue.toLowerCase())) {
        return NextResponse.json(
          { message: 'Boolean değer true veya false olmalıdır' },
          { status: 400 }
        );
      }
    } else if (type === 'JSON') {
      try {
        JSON.parse(validatedValue);
      } catch {
        return NextResponse.json(
          { message: 'Geçersiz JSON formatı' },
          { status: 400 }
        );
      }
    }

    const parameter = await prisma.parameter.update({
      where: { id: params.id },
      data: {
        key: key.trim().toUpperCase(),
        value: validatedValue,
        type,
        description: description?.trim(),
        category
      }
    });

    return NextResponse.json({ parameter });

  } catch (error) {
    console.error('PUT /api/parameters/[id] error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const existingParameter = await prisma.parameter.findUnique({
      where: { id: params.id }
    });

    if (!existingParameter) {
      return NextResponse.json(
        { message: 'Parametre bulunamadı' },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.parameter.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    return NextResponse.json({ 
      message: 'Parametre başarıyla silindi' 
    });

  } catch (error) {
    console.error('DELETE /api/parameters/[id] error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
