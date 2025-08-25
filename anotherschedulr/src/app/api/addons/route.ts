import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { addOnSchema, validateRequestBody } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addOns = await prisma.addOn.findMany({
      where: {
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
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Transform data to include service count and associated services info
    const transformedAddOns = addOns.map(addOn => ({
      ...addOn,
      associatedServicesCount: addOn._count.serviceAddOns,
      associatedServices: addOn.serviceAddOns.map(sa => sa.service)
    }));

    return NextResponse.json(transformedAddOns);
  } catch (error) {
    console.error('Error fetching add-ons:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the raw body to extract serviceIds
    const body = await request.json();
    const serviceIds = body.serviceIds as string[] | undefined;

    // Validate and sanitize input (excluding serviceIds)
    const validation = addOnSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { name, description, duration, price, isAdminOnly, isVisible, sortOrder } = validation.data;

    // If serviceIds are provided, verify they belong to the user
    if (serviceIds && serviceIds.length > 0) {
      const services = await prisma.service.findMany({
        where: {
          id: { in: serviceIds },
          userId: session.user.id
        }
      });

      if (services.length !== serviceIds.length) {
        return NextResponse.json({ error: 'One or more services not found or unauthorized' }, { status: 404 });
      }
    }

    // Create add-on and service associations in a transaction
    const addOn = await prisma.$transaction(async (tx) => {
      // Create the add-on
      const newAddOn = await tx.addOn.create({
        data: {
          name,
          description,
          duration: duration || 0,
          price: price || 0,
          isAdminOnly: isAdminOnly !== undefined ? isAdminOnly : false,
          isVisible: isVisible !== undefined ? isVisible : true,
          sortOrder: sortOrder || 0,
          userId: session.user.id
        }
      });

      // Create service associations if serviceIds provided
      if (serviceIds && serviceIds.length > 0) {
        await tx.serviceAddOn.createMany({
          data: serviceIds.map(serviceId => ({
            serviceId,
            addOnId: newAddOn.id,
            isRequired: false
          }))
        });
      }

      // Return the add-on with associations
      return await tx.addOn.findUnique({
        where: { id: newAddOn.id },
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
    });

    // Transform the response
    const transformedAddOn = {
      ...addOn,
      associatedServicesCount: addOn!._count.serviceAddOns,
      associatedServices: addOn!.serviceAddOns.map(sa => sa.service)
    };

    return NextResponse.json(transformedAddOn, { status: 201 });
  } catch (error) {
    console.error('Error creating add-on:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}