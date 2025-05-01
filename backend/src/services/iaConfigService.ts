import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get IA config for a component
export const getIAConfigForComponent = async (componentId: number) => {
  return await prisma.iAQuestionConfig.findMany({
    where: { componentId },
    orderBy: [
      { questionNumber: 'asc' }
    ]
  });
};

// Create or update IA config
export const createOrUpdateIAConfig = async (componentId: number, configData: any[]) => {
  try {
    // Verify the component exists
    const component = await prisma.examComponent.findUnique({
      where: { id: componentId }
    });
    
    if (!component) {
      throw new Error('Component not found');
    }
    
    // Delete existing config for this component
    await prisma.iAQuestionConfig.deleteMany({
      where: { componentId },
    });
    
    // Create new configs
    const configEntries = await prisma.$transaction(
      configData.map(config => 
        prisma.iAQuestionConfig.create({
          data: {
            componentId,
            questionNumber: config.questionNumber,
            maxMarks: config.maxMarks,
            questionType: config.questionType || null,
          }
        })
      )
    );
    
    return { success: true, data: configEntries };
  } catch (error) {
    console.error('Error creating/updating IA config:', error);
    return { success: false, error: 'Failed to create/update IA configuration' };
  }
};

// Get IA config structure
export const getIAConfigStructure = async (componentId: number) => {
  const configs = await prisma.iAQuestionConfig.findMany({
    where: { componentId },
    orderBy: [
      { questionNumber: 'asc' }
    ]
  });
  
  // Process the config data to create a structure
  const structure = {
    totalMarks: configs.reduce((sum, q) => sum + q.maxMarks, 0),
    questionCount: configs.length,
    questions: configs
  };
  
  return structure;
};

// Delete IA config for a component
export const deleteIAConfig = async (componentId: number) => {
  try {
    // Check if component exists - use examComponent if that's the correct model
    const component = await prisma.examComponent.findUnique({
      where: { id: componentId }
    });
    
    if (!component) {
      return { success: false, error: 'Component not found' };
    }
    
    await prisma.iAQuestionConfig.deleteMany({
      where: { componentId },
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting IA config:', error);
    return { success: false, error: 'Failed to delete IA configuration' };
  }
}; 