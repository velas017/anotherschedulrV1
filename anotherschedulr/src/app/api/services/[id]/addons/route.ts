import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { serviceAddOnSchema, validateRequestBody, idParamSchema } from '@/lib/validations';

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
      return NextResponse.json({ error: 'Invalid service ID' }, { status: 400 });
    }

    // Check if service exists and belongs to user
    const service = await prisma.service.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Get all add-ons for this service
    const serviceAddOns = await prisma.serviceAddOn.findMany({
      where: {
        serviceId: params.id
      },
      include: {
        addOn: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
            isAdminOnly: true,
            isVisible: true,
            sortOrder: true
          }
        }
      },
      orderBy: {
        addOn: {
          sortOrder: 'asc'
        }
      }
    });

    // Transform the response to include add-on details
    const addOns = serviceAddOns.map(sa => ({
      ...sa.addOn,
      isRequired: sa.isRequired
    }));

    return NextResponse.json(addOns);
  } catch (error) {
    console.error('Error fetching service add-ons:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
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
      return NextResponse.json({ error: 'Invalid service ID' }, { status: 400 });
    }

    // Check if service exists and belongs to user
    const service = await prisma.service.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Validate request body - expecting add-on IDs to associate
    const validation = await validateRequestBody(request, serviceAddOnSchema);
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { serviceIds, isRequired } = validation.data;

    // For this endpoint, we're adding add-ons to a service, so we expect addOnIds instead
    // Let me fix the validation by reading the actual request
    const body = await request.json();
    const addOnIds = body.addOnIds as string[];
    const isRequiredFlag = body.isRequired as boolean || false;

    if (!addOnIds || !Array.isArray(addOnIds)) {
      return NextResponse.json({ error: 'addOnIds array is required' }, { status: 400 });
    }

    // Verify all add-ons belong to the user
    const addOns = await prisma.addOn.findMany({
      where: {
        id: { in: addOnIds },
        userId: session.user.id
      }
    });

    if (addOns.length !== addOnIds.length) {
      return NextResponse.json({ error: 'One or more add-ons not found' }, { status: 404 });
    }

    // Remove existing associations and create new ones
    await prisma.$transaction(async (tx) => {
      // Remove existing associations
      await tx.serviceAddOn.deleteMany({
        where: {
          serviceId: params.id
        }
      });

      // Create new associations
      if (addOnIds.length > 0) {
        await tx.serviceAddOn.createMany({
          data: addOnIds.map(addOnId => ({
            serviceId: params.id,
            addOnId,
            isRequired: isRequiredFlag
          }))
        });
      }
    });

    // Return updated associations
    const updatedServiceAddOns = await prisma.serviceAddOn.findMany({
      where: {
        serviceId: params.id
      },
      include: {
        addOn: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
            isAdminOnly: true,
            isVisible: true,
            sortOrder: true
          }
        }
      },
      orderBy: {
        addOn: {
          sortOrder: 'asc'
        }
      }
    });

    const addOnsWithFlags = updatedServiceAddOns.map(sa => ({
      ...sa.addOn,
      isRequired: sa.isRequired
    }));

    return NextResponse.json(addOnsWithFlags, { status: 201 });
  } catch (error) {
    console.error('Error updating service add-ons:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}