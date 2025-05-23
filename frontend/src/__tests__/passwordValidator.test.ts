import { testPasswordValidator } from '../validation/profile';

describe('Password Validator', () => {
  it('should validate a strong password', () => {
    const password = 'StrongP@ss123';
    const result = testPasswordValidator(password);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject a password that is too short', () => {
    const password = 'Ab1!';
    const result = testPasswordValidator(password);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  it('should reject a password without uppercase letters', () => {
    const password = 'password123!';
    const result = testPasswordValidator(password);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  it('should reject a password without lowercase letters', () => {
    const password = 'PASSWORD123!';
    const result = testPasswordValidator(password);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one lowercase letter');
  });

  it('should reject a password without numbers', () => {
    const password = 'Password!';
    const result = testPasswordValidator(password);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one number');
  });

  it('should reject a password without special characters', () => {
    const password = 'Password123';
    const result = testPasswordValidator(password);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one special character');
  });

  it('should validate multiple requirements at once', () => {
    const password = 'pass';
    const result = testPasswordValidator(password);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(4);
    expect(result.errors).toContain('Password must be at least 8 characters');
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
    expect(result.errors).toContain('Password must contain at least one number');
    expect(result.errors).toContain('Password must contain at least one special character');
  });
});
