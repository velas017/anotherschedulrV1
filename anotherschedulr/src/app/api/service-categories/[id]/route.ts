import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, sortOrder, isVisible } = body;

    // Verify category ownership
    const existingCategory = await prisma.serviceCategory.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const category = await prisma.serviceCategory.update({
      where: {
        id: params.id
      },
      data: {
        name,
        description,
        sortOrder,
        isVisible
      },
      include: {
        services: {
          orderBy: [
            { sortOrder: 'asc' },
            { createdAt: 'desc' }
          ]
        }
      }
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating service category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify category ownership
    const existingCategory = await prisma.serviceCategory.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Remove category from services before deleting (only for current user's services)
    await prisma.service.updateMany({
      where: {
        categoryId: params.id,
        userId: session.user.id
      },
      data: {
        categoryId: null
      }
    });

    await prisma.serviceCategory.delete({
      where: {
        id: params.id
      }
    });

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting service category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}