const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateSubdomains() {
  console.log('🚀 Starting subdomain migration...\n');
  
  try {
    // Get all users without subdomains
    const usersWithoutSubdomains = await prisma.user.findMany({
      where: {
        subdomain: null
      },
      select: {
        id: true,
        name: true,
        businessName: true,
        email: true
      }
    });

    console.log(`📊 Found ${usersWithoutSubdomains.length} users without subdomains\n`);

    if (usersWithoutSubdomains.length === 0) {
      console.log('✅ All users already have subdomains. Migration complete!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const user of usersWithoutSubdomains) {
      try {
        console.log(`🔄 Processing user: ${user.email}`);
        
        // Generate unique subdomain
        const subdomain = await generateUniqueSubdomainSimple(user.name, user.businessName);
        
        console.log(`   Generated subdomain: ${subdomain}`);
        
        // Update user with subdomain
        await prisma.user.update({
          where: { id: user.id },
          data: { subdomain }
        });

        console.log(`   ✅ Updated user ${user.email} with subdomain: ${subdomain}\n`);
        successCount++;

      } catch (error) {
        console.error(`   ❌ Error updating user ${user.email}:`, error.message);
        errorCount++;
      }
    }

    console.log('📈 Migration Summary:');
    console.log(`   ✅ Successful updates: ${successCount}`);
    console.log(`   ❌ Failed updates: ${errorCount}`);
    console.log(`   📊 Total processed: ${usersWithoutSubdomains.length}`);

    if (errorCount === 0) {
      console.log('\n🎉 Subdomain migration completed successfully!');
    } else {
      console.log('\n⚠️  Subdomain migration completed with some errors. Please check the logs above.');
    }

  } catch (error) {
    console.error('💥 Fatal error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Simple subdomain generation function for Node.js context
// This is a simplified version since we can't easily import the TS utilities
async function generateUniqueSubdomainSimple(name, businessName) {
  const source = name || businessName || 'user';
  
  // Convert to lowercase and replace spaces/special chars with hyphens
  let subdomain = source
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 63);

  // If empty after cleaning, generate a random subdomain
  if (!subdomain || subdomain.length < 3) {
    subdomain = `user-${Math.random().toString(36).substring(2, 8)}`;
  }

  // Check if subdomain is available
  const existing = await prisma.user.findUnique({
    where: { subdomain }
  });

  if (!existing) {
    return subdomain;
  }

  // If taken, try appending numbers
  for (let i = 2; i <= 999; i++) {
    const candidate = `${subdomain}-${i}`;
    
    if (candidate.length > 63) {
      const truncatedBase = subdomain.substring(0, 63 - `-${i}`.length);
      const truncatedCandidate = `${truncatedBase}-${i}`;
      
      const existingTruncated = await prisma.user.findUnique({
        where: { subdomain: truncatedCandidate }
      });
      
      if (!existingTruncated) {
        return truncatedCandidate;
      }
    } else {
      const existingCandidate = await prisma.user.findUnique({
        where: { subdomain: candidate }
      });
      
      if (!existingCandidate) {
        return candidate;
      }
    }
  }

  // If all attempts failed, generate a random subdomain
  return `user-${Math.random().toString(36).substring(2, 12)}`;
}

// Simple subdomain generation function is defined above

// Run the migration
if (require.main === module) {
  migrateSubdomains()
    .then(() => {
      console.log('\n🏁 Migration script finished.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateSubdomains };