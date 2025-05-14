import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get default components for a subject based on its category
export const getDefaultComponentsForSubject = async (subjectId: number) => {
  try {
    // Get the subject with its category
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: { subjectcategory: true },
    });

    if (!subject) {
      throw new Error('Subject not found');
    }

    if (!subject.subjectcategory) {
      throw new Error('Subject does not have a category assigned');
    }

    // Check if the category has a marking schema defined
    if (subject.subjectcategory.markingSchema) {
      try {
        // Use marking schema from the category if available
        const schema = JSON.parse(subject.subjectcategory.markingSchema);
        return await createComponentsFromSchema(subject.id, schema);
      } catch (e) {
        console.error('Error parsing marking schema:', e);
        // Fall back to default templates if schema parsing fails
      }
    }

    // Get or create components based on category code
    return await generateDefaultComponents(subject.id, subject.subjectcategory.code);
  } catch (error) {
    throw error;
  }
};

// Helper function to create components from a parsed marking schema
const createComponentsFromSchema = async (subjectId: number, schema: any[]) => {
  try {
    // Check if components already exist for this subject
    const existingComponents = await prisma.examcomponent.findMany({
      where: { subjectId },
    });

    if (existingComponents.length > 0) {
      return existingComponents;
    }

    // Create components from schema
    const componentTemplates = schema.map(component => ({
      subjectId,
      name: component.name,
      componentType: component.name.toLowerCase().includes('external') ? 'external' : 'internal',
      maxMarks: component.max_marks || 0,
      weightagePercent: ((component.max_marks || 0) / 100) * 100, // Calculate weightage based on max marks
      isCustom: false,
      updatedAt: new Date() // Required field
    }));
    
    // Create all components in a transaction
    const components = await prisma.$transaction(
      componentTemplates.map(template => 
        prisma.examcomponent.create({
          data: template
        })
      )
    );

    return components;
  } catch (error) {
    console.error('Error creating components from schema:', error);
    return []; // Return empty array instead of crashing
  }
};

// Helper function to generate default components based on subject category
const generateDefaultComponents = async (subjectId: number, categoryCode: string) => {
  try {
    // Check if components already exist for this subject
    const existingComponents = await prisma.examcomponent.findMany({
      where: { subjectId },
    });

    if (existingComponents.length > 0) {
      return existingComponents;
    }

    // Define default components based on category
    const componentTemplates = getComponentTemplatesByCategory(categoryCode, subjectId);
    
    // Create all components in a transaction
    const components = await prisma.$transaction(
      componentTemplates.map(template => 
        prisma.examcomponent.create({
          data: {
            ...template,
            updatedAt: new Date() // Required field
          }
        })
      )
    );

    return components;
  } catch (error) {
    console.error('Error generating default components:', error);
    return []; // Return empty array instead of crashing
  }
};

// Define component templates based on subject category
const getComponentTemplatesByCategory = (categoryCode: string, subjectId: number) => {
  const templates = [];

  switch (categoryCode) {
    case 'IPCC':
      templates.push(
        {
          subjectId,
          name: 'CIE I',
          componentType: 'CIE',
          maxMarks: 15,
          weightagePercent: 20,
        },
        {
          subjectId,
          name: 'CIE II',
          componentType: 'CIE',
          maxMarks: 15,
          weightagePercent: 20,
        },
        {
          subjectId,
          name: 'Assignment',
          componentType: 'Assignment',
          maxMarks: 10,
          weightagePercent: 15,
        },
        {
          subjectId,
          name: 'Lab Record',
          componentType: 'Lab',
          maxMarks: 15, 
          weightagePercent: 25,
        },
        {
          subjectId,
          name: 'Lab CIE',
          componentType: 'Lab',
          maxMarks: 10,
          weightagePercent: 20,
        }
      );
      break;
    
    case 'PCC':
    case 'ESC':
    case 'UHV':
      templates.push(
        {
          subjectId,
          name: 'CIE I',
          componentType: 'CIE',
          maxMarks: 25,
          weightagePercent: 40,
        },
        {
          subjectId,
          name: 'Assignment 1',
          componentType: 'Assignment',
          maxMarks: 15,
          weightagePercent: 30,
        },
        {
          subjectId,
          name: 'Assignment 2',
          componentType: 'Assignment',
          maxMarks: 10,
          weightagePercent: 30,
        }
      );
      break;
    
    case 'PCCL':
    case 'AEC':
      templates.push(
        {
          subjectId,
          name: 'Lab Record',
          componentType: 'Lab',
          maxMarks: 30,
          weightagePercent: 60,
        },
        {
          subjectId,
          name: 'Lab CIE',
          componentType: 'Lab',
          maxMarks: 20,
          weightagePercent: 40,
        }
      );
      break;
    
    case 'PROJ':
      templates.push(
        {
          subjectId,
          name: 'Presentation',
          componentType: 'Project',
          maxMarks: 20,
          weightagePercent: 20,
        },
        {
          subjectId,
          name: 'Requirement Analysis',
          componentType: 'Project',
          maxMarks: 20,
          weightagePercent: 20,
        },
        {
          subjectId,
          name: 'Report',
          componentType: 'Project',
          maxMarks: 20,
          weightagePercent: 20,
        },
        {
          subjectId,
          name: 'IEEE Paper',
          componentType: 'Project',
          maxMarks: 40,
          weightagePercent: 40,
        }
      );
      break;

    case 'MINI':
      templates.push(
        {
          subjectId,
          name: 'Objective of Mini Project',
          componentType: 'Project',
          maxMarks: 20,
          weightagePercent: 20,
        },
        {
          subjectId,
          name: 'Work Undertaken',
          componentType: 'Project',
          maxMarks: 20,
          weightagePercent: 20,
        },
        {
          subjectId,
          name: 'Technical Knowledge',
          componentType: 'Project',
          maxMarks: 20,
          weightagePercent: 20,
        },
        {
          subjectId,
          name: 'Viva Voce',
          componentType: 'Project',
          maxMarks: 20,
          weightagePercent: 20,
        },
        {
          subjectId,
          name: 'Final Report',
          componentType: 'Project',
          maxMarks: 20,
          weightagePercent: 20,
        }
      );
      break;
      
    default:
      // Generic components for unknown categories
      templates.push(
        {
          subjectId,
          name: 'CIE I',
          componentType: 'CIE',
          maxMarks: 20,
          weightagePercent: 50,
        },
        {
          subjectId,
          name: 'Assignment',
          componentType: 'Assignment',
          maxMarks: 20,
          weightagePercent: 50,
        }
      );
  }

  return templates;
};

// Get all components for a subject
export const getComponentsForSubject = async (subjectId: number) => {
  return await prisma.examComponent.findMany({
    where: { subjectId },
    orderBy: { name: 'asc' },
  });
};

// Get a specific component by ID
export const getComponentById = async (id: number) => {
  return await prisma.examComponent.findUnique({
    where: { id },
  });
};

// Create a custom component
export const createCustomComponent = async (data: any) => {
  return await prisma.examComponent.create({
    data: {
      ...data,
      isCustom: true,
    },
  });
};

// Update a component
export const updateComponent = async (id: number, data: any) => {
  return await prisma.examComponent.update({
    where: { id },
    data,
  });
};

// Delete a component
export const deleteComponent = async (id: number) => {
  // Check if there are any marks recorded for this component
  const hasMarks = await prisma.studentComponentMark.findFirst({
    where: { componentId: id },
  });

  if (hasMarks) {
    throw new Error('Cannot delete component with recorded marks');
  }

  return await prisma.examComponent.delete({
    where: { id },
  });
}; 