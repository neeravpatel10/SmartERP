const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addSubjectCategories() {
  const categories = [
    {
      code: 'IPCC',
      name: 'Integrated Professional Core Course',
      description: 'Combined theory and lab components.',
      markingSchema: JSON.stringify([
        {
          name: 'CIE',
          componentType: 'internal',
          maxMarks: 50,
          weightagePercent: 50
        },
        {
          name: 'SEE',
          componentType: 'external',
          maxMarks: 100,
          weightagePercent: 50
        }
      ]),
      updatedAt: new Date()
    },
    {
      code: 'PCC',
      name: 'Professional Core Course',
      description: 'Core subjects with CIE-based evaluations.',
      markingSchema: JSON.stringify([
        {
          name: 'CIE',
          componentType: 'internal',
          maxMarks: 50,
          weightagePercent: 50
        },
        {
          name: 'SEE',
          componentType: 'external',
          maxMarks: 100,
          weightagePercent: 50
        }
      ]),
      updatedAt: new Date()
    },
    {
      code: 'ESC',
      name: 'Engineering Science Course',
      description: 'Fundamental engineering courses.',
      markingSchema: JSON.stringify([
        {
          name: 'CIE',
          componentType: 'internal',
          maxMarks: 50,
          weightagePercent: 50
        },
        {
          name: 'SEE',
          componentType: 'external',
          maxMarks: 100,
          weightagePercent: 50
        }
      ]),
      updatedAt: new Date()
    },
    {
      code: 'UHV',
      name: 'Universal Human Values',
      description: 'Courses focused on human values.',
      markingSchema: JSON.stringify([
        {
          name: 'CIE',
          componentType: 'internal',
          maxMarks: 50,
          weightagePercent: 50
        },
        {
          name: 'SEE',
          componentType: 'external',
          maxMarks: 100,
          weightagePercent: 50
        }
      ]),
      updatedAt: new Date()
    },
    {
      code: 'PCCL',
      name: 'Professional Core Course Lab',
      description: 'Practical lab sessions.',
      markingSchema: JSON.stringify([
        {
          name: 'CIE',
          componentType: 'internal',
          maxMarks: 50,
          weightagePercent: 50
        },
        {
          name: 'SEE',
          componentType: 'external',
          maxMarks: 50,
          weightagePercent: 50
        }
      ]),
      updatedAt: new Date()
    },
    {
      code: 'AEC',
      name: 'Ability Enhancement Course',
      description: 'Skill enhancement practical sessions.',
      markingSchema: JSON.stringify([
        {
          name: 'CIE',
          componentType: 'internal',
          maxMarks: 50,
          weightagePercent: 50
        },
        {
          name: 'SEE',
          componentType: 'external',
          maxMarks: 50,
          weightagePercent: 50
        }
      ]),
      updatedAt: new Date()
    },
    {
      code: 'PROJ',
      name: 'Final Year Project',
      description: 'Major final-year project.',
      markingSchema: JSON.stringify([
        {
          name: 'Phase 1',
          componentType: 'internal',
          maxMarks: 100,
          weightagePercent: 30
        },
        {
          name: 'Phase 2',
          componentType: 'internal',
          maxMarks: 100,
          weightagePercent: 30
        },
        {
          name: 'Final Evaluation',
          componentType: 'external',
          maxMarks: 100,
          weightagePercent: 40
        }
      ]),
      updatedAt: new Date()
    },
    {
      code: 'MINI_PROJ',
      name: 'Mini Project',
      description: 'Smaller, mid-program projects.',
      markingSchema: JSON.stringify([
        {
          name: 'Implementation',
          componentType: 'internal',
          maxMarks: 50,
          weightagePercent: 50
        },
        {
          name: 'Presentation',
          componentType: 'internal',
          maxMarks: 50,
          weightagePercent: 50
        }
      ]),
      updatedAt: new Date()
    },
    {
      code: 'MC',
      name: 'Mandatory Course',
      description: 'Mandatory non-credit courses.',
      markingSchema: JSON.stringify([
        {
          name: 'CIE',
          componentType: 'internal',
          maxMarks: 50,
          weightagePercent: 50
        },
        {
          name: 'SEE',
          componentType: 'external',
          maxMarks: 50,
          weightagePercent: 50
        }
      ]),
      updatedAt: new Date()
    },
    {
      code: 'OEC',
      name: 'Open Elective Course',
      description: 'Electives from outside the core discipline.',
      markingSchema: JSON.stringify([
        {
          name: 'CIE',
          componentType: 'internal',
          maxMarks: 50,
          weightagePercent: 50
        },
        {
          name: 'SEE',
          componentType: 'external',
          maxMarks: 100,
          weightagePercent: 50
        }
      ]),
      updatedAt: new Date()
    },
    {
      code: 'PEC',
      name: 'Professional Elective Course',
      description: 'Electives within the discipline.',
      markingSchema: JSON.stringify([
        {
          name: 'CIE',
          componentType: 'internal',
          maxMarks: 50,
          weightagePercent: 50
        },
        {
          name: 'SEE',
          componentType: 'external',
          maxMarks: 100,
          weightagePercent: 50
        }
      ]),
      updatedAt: new Date()
    },
    {
      code: 'SEC',
      name: 'Skill Enhancement Course',
      description: 'Courses aimed at specific skills.',
      markingSchema: JSON.stringify([
        {
          name: 'CIE',
          componentType: 'internal',
          maxMarks: 50,
          weightagePercent: 50
        },
        {
          name: 'SEE',
          componentType: 'external',
          maxMarks: 50,
          weightagePercent: 50
        }
      ]),
      updatedAt: new Date()
    }
  ];

  console.log('Starting to add subject categories...');

  for (const category of categories) {
    try {
      // Check if category already exists
      const existingCategory = await prisma.subjectcategory.findUnique({
        where: { code: category.code }
      });

      if (existingCategory) {
        console.log(`Category ${category.code} already exists, updating...`);
        await prisma.subjectcategory.update({
          where: { code: category.code },
          data: category
        });
      } else {
        console.log(`Adding new category: ${category.code}`);
        await prisma.subjectcategory.create({
          data: category
        });
      }
    } catch (error) {
      console.error(`Error adding category ${category.code}:`, error);
    }
  }

  console.log('Completed adding subject categories');
}

// Run the function
addSubjectCategories()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  }); 