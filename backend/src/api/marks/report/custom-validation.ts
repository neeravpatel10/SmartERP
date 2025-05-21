import { Request, Response, NextFunction } from 'express';
import { ZodSchema, z } from 'zod';

/**
 * Custom validation middleware that can validate body, query or params
 * @param schema ZodSchema to validate against
 * @param source 'body' | 'query' | 'params' - which part of the request to validate
 */
export const validateRequest = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Choose the source based on the parameter
      const dataToValidate = source === 'body' ? req.body : 
                            source === 'query' ? req.query : req.params;
      
      // Parse and validate the data
      const validatedData = await schema.parseAsync(dataToValidate);
      
      // Add the validated data back to the request
      if (source === 'body') {
        req.body = validatedData;
      } else if (source === 'query') {
        req.query = validatedData;
      } else {
        req.params = validatedData;
      }
      
      next();
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Internal server error during validation'
      });
    }
  };
};
