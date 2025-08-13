/**
 * Safe Mock Data Seeder Script
 * 
 * This script safely seeds mock data without destroying existing data.
 * It includes safeguards to prevent accidental data loss.
 * 
 * Usage:
 *   node scripts/seed-mock-data-safe.js                    # Add mock data to existing user
 *   node scripts/seed-mock-data-safe.js --email user@example.com  # Seed for specific user
 *   node scripts/seed-mock-data-safe.js --clean           # Clean mock data first (dev only)
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const shouldClean = args.includes('--clean');
const emailIndex = args.indexOf('--email');
const targetEmail = emailIndex > -1 ? args[emailIndex + 1] : null;

// Safety check for production
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && shouldClean) {
  console.error('❌ ERROR: Cannot use --clean flag in production environment!');
  console.error('This would delete real user data. Exiting for safety.');
  process.exit(1);
}

// Mock data identifier - helps distinguish mock from real data
const MOCK_DATA_TAG = '[MOCK]';

async function getOrSelectUser(email = null) {
  try {
    // If email specified, try to find that user
    if (email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        console.log(`✅ Using specified user: ${email}`);
        return user;
      }
      console.log(`⚠️ User ${email} not found.`);
    }

    // Find all existing users
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    if (users.length === 0) {
      console.log('📝 No users found. Creating demo user...');
      const hashedPassword = await bcrypt.hash('demo123', 10);
      const demoUser = await prisma.user.create({
        data: {
          email: 'demo@example.com',
          name: 'Demo User',
          password: hashedPassword
        }
      });
      console.log('✅ Created demo user:');
      console.log('   Email: demo@example.com');
      console.log('   Password: demo123');
      return demoUser;
    }

    if (users.length === 1) {
      console.log(`✅ Using existing user: ${users[0].email}`);
      return users[0];
    }

    // Multiple users exist
    console.log('📋 Multiple users found:');
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.name || 'No name'})`);
    });
    console.log(`✅ Using most recent user: ${users[0].email}`);
    console.log('   Tip: Use --email flag to specify a different user');
    
    return users[0];
  } catch (error) {
    console.error('❌ Error selecting user:', error);
    throw error;
  }
}

async function cleanupMockData(userId) {
  console.log('🧹 Cleaning up existing mock data...');
  
  try {
    // Delete mock appointments (identified by tag in description)
    const deletedAppointments = await prisma.appointment.deleteMany({
      where: {
        userId,
        description: { contains: MOCK_DATA_TAG }
      }
    });

    // Delete mock clients
    const deletedClients = await prisma.client.deleteMany({
      where: {
        userId,
        notes: { contains: MOCK_DATA_TAG }
      }
    });

    // Delete mock services
    const deletedServices = await prisma.service.deleteMany({
      where: {
        userId,
        description: { contains: MOCK_DATA_TAG }
      }
    });

    // Delete mock categories
    const deletedCategories = await prisma.serviceCategory.deleteMany({
      where: {
        userId,
        description: { contains: MOCK_DATA_TAG }
      }
    });

    console.log(`✅ Cleanup complete:`);
    console.log(`   - Appointments: ${deletedAppointments.count}`);
    console.log(`   - Clients: ${deletedClients.count}`);
    console.log(`   - Services: ${deletedServices.count}`);
    console.log(`   - Categories: ${deletedCategories.count}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

async function seedMockData() {
  console.log('🌱 Starting SAFE mock data seeding...');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);

  try {
    // Get or select user
    const user = await getOrSelectUser(targetEmail);
    const userId = user.id;

    // Clean up if requested
    if (shouldClean) {
      await cleanupMockData(userId);
      console.log('');
    }

    // Check for existing data
    const existingData = await prisma.appointment.count({ where: { userId } });
    if (existingData > 0 && !shouldClean) {
      console.log(`ℹ️ User already has ${existingData} appointments.`);
      console.log('   Adding mock data alongside existing data...\n');
    }

    // 1. Create Service Categories
    console.log('📂 Creating service categories...');
    const categories = await Promise.all([
      prisma.serviceCategory.create({
        data: {
          name: 'Consultations',
          description: `Initial meetings and assessments ${MOCK_DATA_TAG}`,
          sortOrder: 100, // High sort order to appear at end
          userId
        }
      }),
      prisma.serviceCategory.create({
        data: {
          name: 'Follow-up Sessions',
          description: `Ongoing client support and check-ins ${MOCK_DATA_TAG}`,
          sortOrder: 101,
          userId
        }
      }),
      prisma.serviceCategory.create({
        data: {
          name: 'Workshops',
          description: `Group sessions and training workshops ${MOCK_DATA_TAG}`,
          sortOrder: 102,
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
          description: `Comprehensive initial assessment and planning session ${MOCK_DATA_TAG}`,
          duration: 60,
          price: 150.00,
          categoryId: categories[0].id,
          userId
        }
      }),
      prisma.service.create({
        data: {
          name: 'Follow-up Session',
          description: `Progress review and ongoing support ${MOCK_DATA_TAG}`,
          duration: 45,
          price: 100.00,
          categoryId: categories[1].id,
          userId
        }
      }),
      prisma.service.create({
        data: {
          name: 'Quick Check-in',
          description: `Brief status update and quick guidance ${MOCK_DATA_TAG}`,
          duration: 30,
          price: 75.00,
          categoryId: categories[1].id,
          userId
        }
      }),
      prisma.service.create({
        data: {
          name: 'Extended Session',
          description: `Deep-dive session for complex issues ${MOCK_DATA_TAG}`,
          duration: 90,
          price: 200.00,
          categoryId: categories[0].id,
          userId
        }
      }),
      prisma.service.create({
        data: {
          name: 'Group Workshop',
          description: `Interactive group learning session ${MOCK_DATA_TAG}`,
          duration: 120,
          price: 250.00,
          categoryId: categories[2].id,
          userId
        }
      })
    ]);
    console.log(`✅ Created ${services.length} services\n`);

    // 3. Create Clients
    console.log('👥 Creating mock clients...');
    const clients = await Promise.all([
      prisma.client.create({
        data: {
          name: 'Sarah Johnson (Mock)',
          email: 'sarah.mock@example.com',
          phone: '(555) 123-4567',
          notes: `Regular client, prefers morning appointments ${MOCK_DATA_TAG}`,
          userId
        }
      }),
      prisma.client.create({
        data: {
          name: 'Michael Chen (Mock)',
          email: 'michael.mock@example.com',
          phone: '(555) 234-5678',
          notes: `New client, working on productivity improvement ${MOCK_DATA_TAG}`,
          userId
        }
      }),
      prisma.client.create({
        data: {
          name: 'Emily Rodriguez (Mock)',
          email: 'emily.mock@example.com',
          phone: '(555) 345-6789',
          notes: `VIP client, flexible with scheduling ${MOCK_DATA_TAG}`,
          userId
        }
      }),
      prisma.client.create({
        data: {
          name: 'David Thompson (Mock)',
          email: 'david.mock@example.com',
          phone: '(555) 456-7890',
          notes: `Follow-up client, prefers afternoon slots ${MOCK_DATA_TAG}`,
          userId
        }
      }),
      prisma.client.create({
        data: {
          name: 'Lisa Williams (Mock)',
          email: 'lisa.mock@example.com',
          phone: '(555) 567-8901',
          notes: `Workshop attendee, interested in group sessions ${MOCK_DATA_TAG}`,
          userId
        }
      })
    ]);
    console.log(`✅ Created ${clients.length} mock clients\n`);

    // 4. Create Strategic Appointments
    console.log('📅 Creating mock appointments with proper spacing...');
    
    // Get current week's Thursday and Friday for appointments
    const today = new Date();
    const dayOfWeek = today.getDay();
    const thursday = new Date(today);
    thursday.setDate(today.getDate() + (4 - dayOfWeek)); // Thursday
    thursday.setHours(0, 0, 0, 0);
    
    const friday = new Date(thursday);
    friday.setDate(thursday.getDate() + 1); // Friday

    // Thursday's appointments - properly spaced
    const thursdayAppointments = [
      {
        title: 'Initial Consultation - Sarah Johnson',
        description: `Comprehensive assessment and goal setting ${MOCK_DATA_TAG}`,
        startTime: new Date(thursday.getTime() + 9*60*60*1000 + 15*60*1000), // 9:15 AM
        endTime: new Date(thursday.getTime() + 10*60*60*1000 + 15*60*1000),   // 10:15 AM
        status: 'CONFIRMED',
        clientId: clients[0].id,
        serviceId: services[0].id,
        userId
      },
      {
        title: 'Follow-up Session - Michael Chen',
        description: `Progress review and next steps ${MOCK_DATA_TAG}`,
        startTime: new Date(thursday.getTime() + 11*60*60*1000 + 30*60*1000), // 11:30 AM
        endTime: new Date(thursday.getTime() + 12*60*60*1000 + 15*60*1000),   // 12:15 PM
        status: 'SCHEDULED',
        clientId: clients[1].id,
        serviceId: services[1].id,
        userId
      },
      {
        title: 'Quick Check-in - Emily Rodriguez',
        description: `Brief status update ${MOCK_DATA_TAG}`,
        startTime: new Date(thursday.getTime() + 14*60*60*1000 + 15*60*1000), // 2:15 PM
        endTime: new Date(thursday.getTime() + 14*60*60*1000 + 45*60*1000),   // 2:45 PM
        status: 'CONFIRMED',
        clientId: clients[2].id,
        serviceId: services[2].id,
        userId
      },
      {
        title: 'Extended Consultation - David Thompson',
        description: `Deep-dive session for complex planning ${MOCK_DATA_TAG}`,
        startTime: new Date(thursday.getTime() + 15*60*60*1000), // 3:00 PM - 15 min gap
        endTime: new Date(thursday.getTime() + 16*60*60*1000 + 30*60*1000),   // 4:30 PM
        status: 'SCHEDULED',
        clientId: clients[3].id,
        serviceId: services[3].id,
        userId
      },
      {
        title: 'Follow-up Session - Lisa Williams',
        description: `Workshop follow-up and individual guidance ${MOCK_DATA_TAG}`,
        startTime: new Date(thursday.getTime() + 16*60*60*1000 + 45*60*1000), // 4:45 PM - 15 min gap
        endTime: new Date(thursday.getTime() + 17*60*60*1000 + 30*60*1000),   // 5:30 PM
        status: 'CONFIRMED',
        clientId: clients[4].id,
        serviceId: services[1].id,
        userId
      }
    ];

    // Friday's appointments
    const fridayAppointments = [
      {
        title: 'Extended Session - Sarah Johnson',
        description: `Deep-dive strategy session ${MOCK_DATA_TAG}`,
        startTime: new Date(friday.getTime() + 10*60*60*1000), // 10:00 AM
        endTime: new Date(friday.getTime() + 11*60*60*1000 + 30*60*1000), // 11:30 AM
        status: 'SCHEDULED',
        clientId: clients[0].id,
        serviceId: services[3].id,
        userId
      },
      {
        title: 'Group Workshop - Team Building',
        description: `Interactive group learning session ${MOCK_DATA_TAG}`,
        startTime: new Date(friday.getTime() + 13*60*60*1000), // 1:00 PM
        endTime: new Date(friday.getTime() + 15*60*60*1000),   // 3:00 PM
        status: 'CONFIRMED',
        clientId: clients[4].id,
        serviceId: services[4].id,
        userId
      },
      {
        title: 'Follow-up Session - Michael Chen',
        description: `Progress check and adjustments ${MOCK_DATA_TAG}`,
        startTime: new Date(friday.getTime() + 15*60*60*1000 + 30*60*1000), // 3:30 PM
        endTime: new Date(friday.getTime() + 16*60*60*1000 + 15*60*1000),   // 4:15 PM
        status: 'SCHEDULED',
        clientId: clients[1].id,
        serviceId: services[1].id,
        userId
      }
    ];

    // Create all appointments
    const allAppointments = [...thursdayAppointments, ...fridayAppointments];
    const createdAppointments = await Promise.all(
      allAppointments.map(apt => prisma.appointment.create({ data: apt }))
    );

    console.log(`✅ Created ${createdAppointments.length} mock appointments\n`);

    // 5. Summary
    console.log('📊 SEEDING SUMMARY:');
    console.log('═══════════════════════════════════════');
    console.log(`   User: ${user.email}`);
    console.log(`   Service Categories: ${categories.length}`);
    console.log(`   Services: ${services.length}`);
    console.log(`   Clients: ${clients.length}`);
    console.log(`   Appointments: ${createdAppointments.length}`);
    
    console.log('\n🎯 MOCK DATA FEATURES:');
    console.log('   ✓ Non-overlapping appointments with 15-min gaps');
    console.log('   ✓ Precise minute positioning (9:15, 2:15, 3:00, etc.)');
    console.log('   ✓ Different statuses (SCHEDULED, CONFIRMED)');
    console.log('   ✓ Various durations (30, 45, 60, 90, 120 minutes)');
    console.log('   ✓ Thursday and Friday appointments');
    console.log('   ✓ All mock data tagged for easy cleanup');
    
    console.log('\n🌐 VIEW YOUR CALENDAR AT:');
    console.log(`   http://localhost:3000/calendar`);
    console.log(`   Login as: ${user.email}\n`);
    
    console.log('💡 TIPS:');
    console.log('   • To remove mock data: node scripts/seed-mock-data-safe.js --clean');
    console.log('   • To seed for specific user: node scripts/seed-mock-data-safe.js --email user@example.com');
    console.log('   • Mock data is tagged with [MOCK] for easy identification\n');
    
    console.log('🎉 Safe mock data seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding mock data:', error);
    console.error('\n💡 Troubleshooting tips:');
    console.error('   1. Make sure the database is running');
    console.error('   2. Check that migrations are up to date: npx prisma migrate dev');
    console.error('   3. Verify your .env file has correct DATABASE_URL');
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