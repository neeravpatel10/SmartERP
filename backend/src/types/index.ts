import { Request } from 'express';

// Common JWT payload interface used across controllers
export interface JwtPayload {
  userId: number;
  username: string;
  loginType: number;
  departmentId?: number;
}

// Extend Express Request with authenticated user
export interface AuthRequest extends Request {
  user: JwtPayload;
}

// A version where user might be undefined (for optional authentication)
export interface OptionalAuthRequest extends Request {
  user?: JwtPayload;
}

// Define common entity types to avoid errors
export enum MappingStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

// Type-safe record type with number keys
export type NumberKeyedRecord<T> = {
  [key: number]: T;
};

// Type-safe record type with string keys
export type StringKeyedRecord<T> = {
  [key: string]: T;
}; 