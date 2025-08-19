const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getUser() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true }
  });
  
  if (users.length > 0) {
    console.log('Found users:');
    users.forEach(user => {
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log('---');
    });
    console.log(`\nUse this ID in seed-mock-data.js: ${users[0].id}`);
  } else {
    console.log('No users found. Please create a user first by signing up.');
  }
  
  await prisma.$disconnect();
}

getUser().catch(console.error);
