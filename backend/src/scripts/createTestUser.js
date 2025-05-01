// Script to create a test user in the database
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: 'testuser' }
    });

    if (existingUser) {
      console.log('Test user already exists. Updating password...');
      
      // Update the user's password to a known value
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { 
          passwordHash: hashedPassword,
          failedLoginAttempts: 0,
          lockedUntil: null,
          isActive: true
        }
      });
      
      console.log('Test user password updated successfully!');
      console.log('You can now login with:');
      console.log('Username: testuser');
      console.log('Password: Password123!');
      
      return;
    }

    // Create a department if none exists
    let department = await prisma.department.findFirst();
    
    if (!department) {
      department = await prisma.department.create({
        data: {
          code: 'TEST',
          name: 'Test Department'
        }
      });
      console.log('Created test department:', department);
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    const newUser = await prisma.user.create({
      data: {
        username: 'testuser',
        email: 'testuser@example.com',
        passwordHash: hashedPassword,
        loginType: 1, // Super Admin
        departmentId: department.id,
        isActive: true,
        firstLogin: false
      }
    });

    console.log('Test user created successfully!');
    console.log('You can now login with:');
    console.log('Username: testuser');
    console.log('Password: Password123!');
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser(); 