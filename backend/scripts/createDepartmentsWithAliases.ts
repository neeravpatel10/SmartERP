import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createDepartmentsWithAliases() {
    console.log('Starting department creation with aliases...');

    const departments = [
        { code: 'CSE', name: 'Computer Science Engineering', aliases: ['Computer Science and Engineering', 'CSE', 'Computer Science'] },
        { code: 'ISE', name: 'Information Science Engineering', aliases: ['Information Science and Engineering', 'ISE', 'Information Science'] },
        { code: 'ECE', name: 'Electronics and Communication Engineering', aliases: ['Electronics & Communication', 'E&C', 'EC'] },
        { code: 'EEE', name: 'Electrical and Electronics Engineering', aliases: ['Electrical & Electronics', 'E&E', 'EE'] },
        { code: 'ME', name: 'Mechanical Engineering', aliases: ['Mechanical', 'MECH'] },
        { code: 'CV', name: 'Civil Engineering', aliases: ['Civil', 'CE'] },
        { code: 'AE', name: 'Aerospace Engineering', aliases: ['Aerospace', 'Aeronautical Engineering'] },
        { code: 'CHE', name: 'Chemical Engineering', aliases: ['Chemical', 'CHEM E'] },
        { code: 'AGR', name: 'Agricultural Engineering', aliases: ['Agriculture', 'Agriculture Engineering', 'Agri'] },
        { code: 'MATH', name: 'Mathematics', aliases: ['Maths', 'Mathematics Department'] },
        { code: 'PHY', name: 'Physics', aliases: ['Physics Department'] },
        { code: 'CHEM', name: 'Chemistry', aliases: ['Chemistry Department'] },
        { code: 'MGMT', name: 'Management Studies', aliases: ['MBA', 'Management', 'Business Administration'] },
        { code: 'HUM', name: 'Humanities', aliases: ['Social Sciences', 'Arts'] },
    ];

    // Create a mapping of all aliases to their canonical department
    const departmentAliasMap = new Map();
    for (const dept of departments) {
        departmentAliasMap.set(dept.name.toLowerCase(), dept);
        departmentAliasMap.set(dept.code.toLowerCase(), dept);
        for (const alias of dept.aliases) {
            departmentAliasMap.set(alias.toLowerCase(), dept);
        }
    }

    console.log(`Created alias map with ${departmentAliasMap.size} entries.`);

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
        console.log('\nTo use the department aliases for imports, retrieve this mapping:');
        console.log('const departments = await prisma.department.findMany();');
        console.log('const departmentAliasMap = new Map();');
        
        console.log(`
// Example mapping code to add to import scripts:
const departmentAliasMap = new Map([
  ${departments.map(d => `
  // ${d.name} (${d.code})
  ${[d.name, d.code, ...d.aliases].map(a => `  ["${a.toLowerCase()}", "${d.code}"]`).join(',\n')}
  `).join(',')}
]);

// Usage example:
function findDepartmentId(departmentName, departmentMap, aliasMap) {
  if (!departmentName) return null;
  const deptLower = departmentName.toLowerCase();
  
  // Direct match by name or code
  const directMatch = departmentMap.get(deptLower);
  if (directMatch) return directMatch;
  
  // Try to find by alias
  const aliasCode = aliasMap.get(deptLower);
  if (aliasCode) return departmentMap.get(aliasCode.toLowerCase());
  
  return null;
}
`);

    } catch (error) {
        console.error('An error occurred during department creation:', error);
    } finally {
        await prisma.$disconnect();
        console.log('Database connection closed.');
    }
}

createDepartmentsWithAliases(); 