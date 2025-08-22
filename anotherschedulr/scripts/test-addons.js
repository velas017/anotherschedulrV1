const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAddOns() {
  try {
    console.log('📊 Testing Add-Ons Data...\n');

    // Get all add-ons with their associations
    const addOns = await prisma.addOn.findMany({
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
      orderBy: {
        sortOrder: 'asc'
      }
    });

    console.log(`Found ${addOns.length} add-ons:\n`);
    console.log('┌─────────────────────────────────────────────┬──────────┬──────────┬────────────┐');
    console.log('│ Name                                        │ Duration │ Price    │ Services   │');
    console.log('├─────────────────────────────────────────────┼──────────┼──────────┼────────────┤');
    
    addOns.forEach(addOn => {
      const name = addOn.name.padEnd(43).substring(0, 43);
      const duration = `${addOn.duration} min`.padEnd(8);
      const price = `$${addOn.price.toFixed(2)}`.padEnd(8);
      const services = `${addOn._count.serviceAddOns} types`.padEnd(10);
      
      console.log(`│ ${name} │ ${duration} │ ${price} │ ${services} │`);
    });
    
    console.log('└─────────────────────────────────────────────┴──────────┴──────────┴────────────┘');

    // Show detailed associations for the first add-on
    if (addOns.length > 0) {
      const firstAddOn = addOns[0];
      console.log(`\n📎 Services associated with "${firstAddOn.name}":`);
      firstAddOn.serviceAddOns.forEach(sa => {
        console.log(`   • ${sa.service.name}`);
      });
    }

    console.log('\n✅ Add-ons data verified successfully!');
  } catch (error) {
    console.error('❌ Error testing add-ons:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAddOns();