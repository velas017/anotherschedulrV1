const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAddOns() {
  try {
    console.log('🌱 Starting to seed add-ons...');

    // First, get a user to associate the add-ons with
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.error('❌ No user found in database. Please create a user first.');
      return;
    }

    console.log(`✅ Found user: ${user.email}`);

    // Create sample add-ons
    const addOnsData = [
      {
        name: 'Aromatherapy Scalp Massage (Peppermint)',
        description: 'Relaxing scalp massage with peppermint essential oils',
        duration: 0,
        price: 5.00,
        isAdminOnly: false,
        isVisible: true,
        sortOrder: 1,
        userId: user.id
      },
      {
        name: 'Dermaplaning',
        description: 'Gentle exfoliation treatment to remove dead skin cells',
        duration: 0,
        price: 25.00,
        isAdminOnly: false,
        isVisible: true,
        sortOrder: 2,
        userId: user.id
      },
      {
        name: 'High Frequency',
        description: 'Electrical current treatment for acne and skin rejuvenation',
        duration: 0,
        price: 10.00,
        isAdminOnly: false,
        isVisible: true,
        sortOrder: 3,
        userId: user.id
      },
      {
        name: 'Ice Globe Massage',
        description: 'Cooling massage treatment to reduce puffiness',
        duration: 0,
        price: 0.00,
        isAdminOnly: false,
        isVisible: true,
        sortOrder: 4,
        userId: user.id
      },
      {
        name: 'LED Blue Light Therapy (Acne)',
        description: 'Blue light therapy specifically for acne treatment',
        duration: 0,
        price: 10.00,
        isAdminOnly: false,
        isVisible: true,
        sortOrder: 5,
        userId: user.id
      },
      {
        name: 'LED Red Light Therapy (Anti-Aging)',
        description: 'Red light therapy for anti-aging and collagen production',
        duration: 0,
        price: 10.00,
        isAdminOnly: false,
        isVisible: true,
        sortOrder: 6,
        userId: user.id
      },
      {
        name: 'Microdermabrasion',
        description: 'Advanced exfoliation treatment for skin renewal',
        duration: 0,
        price: 20.00,
        isAdminOnly: false,
        isVisible: true,
        sortOrder: 7,
        userId: user.id
      },
      {
        name: 'Peptide Firming Mask',
        description: 'Firming mask treatment with peptides',
        duration: 15,
        price: 30.00,
        isAdminOnly: false,
        isVisible: true,
        sortOrder: 8,
        userId: user.id
      },
      {
        name: 'Silent Appointment - Relax Time',
        description: 'Enjoy your appointment in peaceful silence',
        duration: 0,
        price: 0.00,
        isAdminOnly: false,
        isVisible: true,
        sortOrder: 9,
        userId: user.id
      }
    ];

    // Delete existing add-ons for this user (optional - comment out if you want to keep existing)
    await prisma.addOn.deleteMany({
      where: { userId: user.id }
    });
    console.log('🗑️  Cleared existing add-ons');

    // Create the add-ons
    let createdCount = 0;
    for (const addOnData of addOnsData) {
      const addOn = await prisma.addOn.create({
        data: addOnData
      });
      createdCount++;
      console.log(`✅ Created add-on: ${addOn.name}`);
    }

    // Now let's associate some add-ons with services if they exist
    const services = await prisma.service.findMany({
      where: { userId: user.id },
      take: 5
    });

    if (services.length > 0) {
      console.log(`\n📎 Associating add-ons with ${services.length} services...`);
      
      // Get all add-ons we just created
      const addOns = await prisma.addOn.findMany({
        where: { userId: user.id }
      });

      // Create associations for each service
      for (const service of services) {
        // Associate random add-ons with each service
        const numberOfAddOns = Math.floor(Math.random() * 4) + 5; // 5-8 add-ons per service
        const selectedAddOns = addOns
          .sort(() => 0.5 - Math.random())
          .slice(0, numberOfAddOns);

        for (const addOn of selectedAddOns) {
          try {
            await prisma.serviceAddOn.create({
              data: {
                serviceId: service.id,
                addOnId: addOn.id,
                isRequired: false
              }
            });
          } catch (error) {
            // Skip if association already exists
            if (error.code !== 'P2002') {
              throw error;
            }
          }
        }
        console.log(`✅ Associated ${selectedAddOns.length} add-ons with service: ${service.name}`);
      }
    } else {
      console.log('ℹ️  No services found to associate with add-ons');
    }

    console.log(`\n🎉 Successfully seeded ${createdCount} add-ons!`);
  } catch (error) {
    console.error('❌ Error seeding add-ons:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedAddOns();