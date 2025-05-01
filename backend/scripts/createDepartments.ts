import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createDepartments() {
    console.log('Starting department creation...');

    const departments = [
        { code: 'CSE', name: 'Computer Science Engineering' },
        { code: 'ISE', name: 'Information Science Engineering' },
        { code: 'ECE', name: 'Electronics and Communication Engineering' },
        { code: 'EEE', name: 'Electrical and Electronics Engineering' },
        { code: 'ME', name: 'Mechanical Engineering' },
        { code: 'CV', name: 'Civil Engineering' },
        { code: 'AE', name: 'Aerospace Engineering' },
        { code: 'CHE', name: 'Chemical Engineering' },
        { code: 'AGR', name: 'Agricultural Engineering' },
        { code: 'MATH', name: 'Mathematics' },
        { code: 'PHY', name: 'Physics' },
        { code: 'CHEM', name: 'Chemistry' },
        { code: 'MGMT', name: 'Management Studies' },
        { code: 'HUM', name: 'Humanities' },
    ];

    try {
        // Count existing departments
        const existingCount = await prisma.department.count();
        console.log(`Found ${existingCount} existing departments.`);

        let created = 0;
        let skipped = 0;

        for (const dept of departments) {
            try {
                // Check if department already exists
                const existing = await prisma.department.findFirst({
                    where: {
                        OR: [
                            { code: dept.code },
                            { name: dept.name }
                        ]
                    }
                });

                if (existing) {
                    console.log(`Skipping: Department "${dept.name}" (${dept.code}) already exists.`);
                    skipped++;
                    continue;
                }

                // Create the department
                await prisma.department.create({
                    data: {
                        code: dept.code,
                        name: dept.name
                    }
                });
                
                console.log(`Created department: ${dept.name} (${dept.code})`);
                created++;
            } catch (error) {
                console.error(`Error creating department ${dept.name}:`, error);
                skipped++;
            }
        }

        console.log('\nDepartment creation complete.');
        console.log(`Created: ${created} departments`);
        console.log(`Skipped: ${skipped} departments`);

    } catch (error) {
        console.error('An error occurred during department creation:', error);
    } finally {
        await prisma.$disconnect();
        console.log('Database connection closed.');
    }
}

createDepartments(); 