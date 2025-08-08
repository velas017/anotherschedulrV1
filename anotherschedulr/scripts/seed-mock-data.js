// Mock data seeder script for calendar testing
// Run with: node scripts/seed-mock-data.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const userId = 'cmdkahvh00000m4p9lboety5q'; // Your existing user ID

async function seedMockData() {
  console.log('🌱 Starting mock data seeding...\n');

  try {
    // 1. Create Service Categories
    console.log('📂 Creating service categories...');
    const categories = await Promise.all([
      prisma.serviceCategory.create({
        data: {
          name: 'Consultations',
          description: 'Initial meetings and assessments',
          sortOrder: 1,
          userId
        }
      }),
      prisma.serviceCategory.create({
        data: {
          name: 'Follow-up Sessions',
          description: 'Ongoing client support and check-ins',
          sortOrder: 2,
          userId
        }
      }),
      prisma.serviceCategory.create({
        data: {
          name: 'Workshops',
          description: 'Group sessions and training workshops',
          sortOrder: 3,
          userId
        }
      })
    ]);
    console.log(`✅ Created ${categories.length} service categories\n`);

    // 2. Create Services
    console.log('🛠️ Creating services...');
    const services = await Promise.all([
      prisma.service.create({
        data: {
          name: 'Initial Consultation',
          description: 'Comprehensive initial assessment and planning session',
          duration: 60,
          price: 150.00,
          categoryId: categories[0].id,
          userId
        }
      }),
      prisma.service.create({
        data: {
          name: 'Follow-up Session',
          description: 'Progress review and ongoing support',
          duration: 45,
          price: 100.00,
          categoryId: categories[1].id,
          userId
        }
      }),
      prisma.service.create({
        data: {
          name: 'Quick Check-in',
          description: 'Brief status update and quick guidance',
          duration: 30,
          price: 75.00,
          categoryId: categories[1].id,
          userId
        }
      }),
      prisma.service.create({
        data: {
          name: 'Extended Session',
          description: 'Deep-dive session for complex issues',
          duration: 90,
          price: 200.00,
          categoryId: categories[0].id,
          userId
        }
      }),
      prisma.service.create({
        data: {
          name: 'Group Workshop',
          description: 'Interactive group learning session',
          duration: 120,
          price: 250.00,
          categoryId: categories[2].id,
          userId
        }
      })
    ]);
    console.log(`✅ Created ${services.length} services\n`);

    // 3. Create Clients
    console.log('👥 Creating clients...');
    const clients = await Promise.all([
      prisma.client.create({
        data: {
          name: 'Sarah Johnson',
          email: 'sarah.johnson@email.com',
          phone: '(555) 123-4567',
          notes: 'Regular client, prefers morning appointments',
          userId
        }
      }),
      prisma.client.create({
        data: {
          name: 'Michael Chen',
          email: 'michael.chen@email.com',
          phone: '(555) 234-5678',
          notes: 'New client, working on productivity improvement',
          userId
        }
      }),
      prisma.client.create({
        data: {
          name: 'Emily Rodriguez',
          email: 'emily.rodriguez@email.com',
          phone: '(555) 345-6789',
          notes: 'VIP client, flexible with scheduling',
          userId
        }
      }),
      prisma.client.create({
        data: {
          name: 'David Thompson',
          email: 'david.thompson@email.com',
          phone: '(555) 456-7890',
          notes: 'Follow-up client, prefers afternoon slots',
          userId
        }
      }),
      prisma.client.create({
        data: {
          name: 'Lisa Williams',
          email: 'lisa.williams@email.com',
          phone: '(555) 567-8901',
          notes: 'Workshop attendee, interested in group sessions',
          userId
        }
      })
    ]);
    console.log(`✅ Created ${clients.length} clients\n`);

    // 4. Create Strategic Appointments for Testing
    console.log('📅 Creating appointments with precise times...');
    
    // Get today's date and tomorrow's date
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Today's appointments (Aug 7, 2025) - showcasing precise positioning
    const todayAppointments = [
      {
        title: 'Initial Consultation - Sarah Johnson',
        description: 'Comprehensive assessment and goal setting',
        startTime: new Date(today.getTime() + 9*60*60*1000 + 15*60*1000), // 9:15 AM
        endTime: new Date(today.getTime() + 10*60*60*1000 + 15*60*1000),   // 10:15 AM
        status: 'CONFIRMED',
        clientId: clients[0].id,
        serviceId: services[0].id,
        userId
      },
      {
        title: 'Follow-up Session - Michael Chen',
        description: 'Progress review and next steps',
        startTime: new Date(today.getTime() + 11*60*60*1000 + 30*60*1000), // 11:30 AM
        endTime: new Date(today.getTime() + 12*60*60*1000 + 15*60*1000),   // 12:15 PM
        status: 'SCHEDULED',
        clientId: clients[1].id,
        serviceId: services[1].id,
        userId
      },
      {
        title: 'Quick Check-in - Emily Rodriguez',
        description: 'Brief status update',
        startTime: new Date(today.getTime() + 14*60*60*1000 + 15*60*1000), // 2:15 PM (14:15)
        endTime: new Date(today.getTime() + 14*60*60*1000 + 45*60*1000),   // 2:45 PM (14:45)
        status: 'CONFIRMED',
        clientId: clients[2].id,
        serviceId: services[2].id,
        userId
      },
      {
        title: 'Extended Consultation - David Thompson',
        description: 'Deep-dive session for complex planning',
        startTime: new Date(today.getTime() + 14*60*60*1000 + 45*60*1000), // 2:45 PM (14:45)
        endTime: new Date(today.getTime() + 16*60*60*1000 + 15*60*1000),   // 4:15 PM (16:15)
        status: 'SCHEDULED',
        clientId: clients[3].id,
        serviceId: services[3].id,
        userId
      },
      {
        title: 'Follow-up Session - Lisa Williams',
        description: 'Workshop follow-up and individual guidance',
        startTime: new Date(today.getTime() + 16*60*60*1000 + 15*60*1000), // 4:15 PM (16:15)
        endTime: new Date(today.getTime() + 17*60*60*1000 + 30*60*1000),   // 5:30 PM (17:30)
        status: 'CONFIRMED',
        clientId: clients[4].id,
        serviceId: services[1].id,
        userId
      }
    ];

    // Tomorrow's appointments (Aug 8, 2025)
    const tomorrowAppointments = [
      {
        title: 'Extended Session - Sarah Johnson',
        description: 'Deep-dive strategy session',
        startTime: new Date(tomorrow.getTime() + 10*60*60*1000), // 10:00 AM
        endTime: new Date(tomorrow.getTime() + 11*60*60*1000 + 30*60*1000), // 11:30 AM
        status: 'SCHEDULED',
        clientId: clients[0].id,
        serviceId: services[3].id,
        userId
      },
      {
        title: 'Group Workshop - Team Building',
        description: 'Interactive group learning session',
        startTime: new Date(tomorrow.getTime() + 13*60*60*1000), // 1:00 PM
        endTime: new Date(tomorrow.getTime() + 15*60*60*1000),   // 3:00 PM
        status: 'CONFIRMED',
        clientId: clients[4].id,
        serviceId: services[4].id,
        userId
      },
      {
        title: 'Follow-up Session - Michael Chen',
        description: 'Progress check and adjustments',
        startTime: new Date(tomorrow.getTime() + 15*60*60*1000 + 30*60*1000), // 3:30 PM
        endTime: new Date(tomorrow.getTime() + 16*60*60*1000 + 15*60*1000),   // 4:15 PM
        status: 'SCHEDULED',
        clientId: clients[1].id,
        serviceId: services[1].id,
        userId
      }
    ];

    // Create all appointments
    const allAppointments = [...todayAppointments, ...tomorrowAppointments];
    const createdAppointments = await Promise.all(
      allAppointments.map(apt => prisma.appointment.create({ data: apt }))
    );

    console.log(`✅ Created ${createdAppointments.length} appointments\n`);

    // 5. Summary
    console.log('📊 SEEDING SUMMARY:');
    console.log(`   Service Categories: ${categories.length}`);
    console.log(`   Services: ${services.length}`);
    console.log(`   Clients: ${clients.length}`);
    console.log(`   Appointments: ${createdAppointments.length}`);
    console.log('\n🎯 TESTING FEATURES:');
    console.log('   ✓ Precise minute positioning (9:15, 2:15, 2:45, etc.)');
    console.log('   ✓ Back-to-back appointments (2:15-2:45 → 2:45-4:15)');
    console.log('   ✓ Different statuses (SCHEDULED, CONFIRMED)');
    console.log('   ✓ Various durations (30min, 45min, 60min, 90min, 120min)');
    console.log('   ✓ Multiple days of data');
    console.log('\n🌐 VIEW YOUR CALENDAR AT:');
    console.log('   http://localhost:3000/calendar\n');
    
    console.log('🎉 Mock data seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding mock data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedMockData().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});