import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findUsers() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        loginType: true
      }
    });

    console.log('Available users:', users);

    // Also check if subject ID 1 exists
    const subject = await prisma.subject.findUnique({
      where: { id: 1 }
    });

    console.log('Subject with ID 1:', subject);

  } catch (error) {
    console.error('Error finding users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
findUsers()
  .then(() => console.log('Done!'))
  .catch(console.error);
