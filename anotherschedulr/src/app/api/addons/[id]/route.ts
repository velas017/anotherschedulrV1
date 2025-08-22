import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { addOnSchema, validateRequestBody, idParamSchema } from '@/lib/validations';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate ID parameter
    const idValidation = idParamSchema.safeParse({ id: params.id });
    if (!idValidation.success) {
      return NextResponse.json({ error: 'Invalid add-on ID' }, { status: 400 });
    }

    const addOn = await prisma.addOn.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      },
      include: {
        serviceAddOns: {
          include: {
            service: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            serviceAddOns: true
          }
        }
      }
    });

    if (!addOn) {
      return NextResponse.json({ error: 'Add-on not found' }, { status: 404 });
    }

    // Transform the response
    const transformedAddOn = {
      ...addOn,
      associatedServicesCount: addOn._count.serviceAddOns,
      associatedServices: addOn.serviceAddOns.map(sa => sa.service)
    };

    return NextResponse.json(transformedAddOn);
  } catch (error) {
    console.error('Error fetching add-on:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate ID parameter
    const idValidation = idParamSchema.safeParse({ id: params.id });
    if (!idValidation.success) {
      return NextResponse.json({ error: 'Invalid add-on ID' }, { status: 400 });
    }

    // Validate and sanitize input
    const validation = await validateRequestBody(request, addOnSchema);
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { name, description, duration, price, isAdminOnly, isVisible, sortOrder } = validation.data;

    // Check if add-on exists and belongs to user
    const existingAddOn = await prisma.addOn.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    });

    if (!existingAddOn) {
      return NextResponse.json({ error: 'Add-on not found' }, { status: 404 });
    }

    const updatedAddOn = await prisma.addOn.update({
      where: {
        id: params.id
      },
      data: {
        name,
        description,
        duration: duration !== undefined ? duration : existingAddOn.duration,
        price: price !== undefined ? price : existingAddOn.price,
        isAdminOnly: isAdminOnly !== undefined ? isAdminOnly : existingAddOn.isAdminOnly,
        isVisible: isVisible !== undefined ? isVisible : existingAddOn.isVisible,
        sortOrder: sortOrder !== undefined ? sortOrder : existingAddOn.sortOrder,
      },
      include: {
        serviceAddOns: {
          include: {
            service: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            serviceAddOns: true
          }
        }
      }
    });

    // Transform the response
    const transformedAddOn = {
      ...updatedAddOn,
      associatedServicesCount: updatedAddOn._count.serviceAddOns,
      associatedServices: updatedAddOn.serviceAddOns.map(sa => sa.service)
    };

    return NextResponse.json(transformedAddOn);
  } catch (error) {
    console.error('Error updating add-on:', error);
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

    // Validate ID parameter
    const idValidation = idParamSchema.safeParse({ id: params.id });
    if (!idValidation.success) {
      return NextResponse.json({ error: 'Invalid add-on ID' }, { status: 400 });
    }

    // Check if add-on exists and belongs to user
    const existingAddOn = await prisma.addOn.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      },
      include: {
        appointmentAddOns: true
      }
    });

    if (!existingAddOn) {
      return NextResponse.json({ error: 'Add-on not found' }, { status: 404 });
    }

    // Check if add-on is currently used in any appointments
    if (existingAddOn.appointmentAddOns.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete add-on that is associated with existing appointments' 
      }, { status: 409 });
    }

    // Delete the add-on (CASCADE will handle ServiceAddOn relationships)
    await prisma.addOn.delete({
      where: {
        id: params.id
      }
    });

    return NextResponse.json({ message: 'Add-on deleted successfully' });
  } catch (error) {
    console.error('Error deleting add-on:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}