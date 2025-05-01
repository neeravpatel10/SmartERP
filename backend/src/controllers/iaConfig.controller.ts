import { Request, Response } from 'express';
import { 
  getIAConfigForComponent, 
  createOrUpdateIAConfig, 
  getIAConfigStructure, 
  deleteIAConfig 
} from '../services/iaConfigService';
import { AuthRequest } from '../types';

/**
 * Get IA configuration for a component
 */
export const getIAConfig = async (req: Request, res: Response) => {
  try {
    const { componentId } = req.params;
    
    const config = await getIAConfigForComponent(parseInt(componentId));
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Get IA config error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get structured IA configuration for a component
 */
export const getStructuredIAConfig = async (req: Request, res: Response) => {
  try {
    const { componentId } = req.params;
    
    const structure = await getIAConfigStructure(parseInt(componentId));
    
    res.json({
      success: true,
      data: structure
    });
  } catch (error) {
    console.error('Get structured IA config error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create or update IA configuration
 */
export const saveIAConfig = async (req: Request & { user: any }, res: Response) => {
  try {
    const { componentId } = req.params;
    const configData = req.body.configData;
    
    // Ensure user is authenticated
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (!configData || !Array.isArray(configData)) {
      return res.status(400).json({
        success: false,
        message: 'Config data must be an array'
      });
    }
    
    // Check service implementation to determine parameter count
    const result = await createOrUpdateIAConfig(parseInt(componentId), configData);
    
    res.json({
      success: true,
      message: 'IA configuration updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Save IA config error:', error);
    
    if ((error as Error).message === 'Component not found') {
      return res.status(404).json({
        success: false,
        message: 'Component not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete IA configuration
 */
export const removeIAConfig = async (req: Request, res: Response) => {
  try {
    const { componentId } = req.params;
    
    await deleteIAConfig(parseInt(componentId));
    
    res.json({
      success: true,
      message: 'IA configuration deleted successfully'
    });
  } catch (error) {
    console.error('Delete IA config error:', error);
    
    if ((error as Error).message === 'Cannot delete IA configuration with recorded marks') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete IA configuration with recorded marks'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 