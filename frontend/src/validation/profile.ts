import * as yup from 'yup';

// Phone pattern for Indian mobile numbers (10 digits)
const phoneRegExp = /^[6-9]\d{9}$/;

// Basic tab validation schema
export const basicInfoSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  preferredName: yup.string().nullable(),
  email: yup.string().email('Invalid email').required('Email is required'),
  departmentId: yup.number().nullable(),
  designation: yup.string().nullable(),
  dateOfBirth: yup.date().nullable().typeError('Invalid date format'),
  gender: yup.string().nullable(),
});

// Contact tab validation schema
export const contactInfoSchema = yup.object().shape({
  phone: yup
    .string()
    .required('Phone number is required')
    .matches(phoneRegExp, 'Please enter a valid 10-digit phone number'),
  altPhone: yup
    .string()
    .nullable()
    .matches(phoneRegExp, 'Please enter a valid 10-digit phone number')
    .notRequired(),
  addressLine1: yup.string().nullable(),
  addressLine2: yup.string().nullable(),
  addressLine3: yup.string().nullable(),
  city: yup.string().nullable(),
  state: yup.string().nullable(),
  pincode: yup.string().nullable().matches(/^\d{6}$/, 'Pincode must be 6 digits'),
});

// Academic tab validation schema
export const academicInfoSchema = yup.object().shape({
  batch: yup.string().nullable(),
  section: yup.string().nullable(),
  semester: yup.number().nullable().typeError('Semester must be a number'),
  subjectsTaught: yup.array().of(yup.number()).nullable(),
});

// Password change validation schema
export const passwordChangeSchema = yup.object().shape({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: yup
    .string()
    .required('Confirm password is required')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});

// Combined schema for the entire profile
export const profileSchema = yup.object().shape({
  // Basic info
  name: yup.string().required('Name is required'),
  preferredName: yup.string().nullable(),
  email: yup.string().email('Invalid email').required('Email is required'),
  departmentId: yup.number().nullable(),
  designation: yup.string().nullable(),
  dateOfBirth: yup.date().nullable().typeError('Invalid date format'),
  gender: yup.string().nullable(),
  
  // Contact info
  phone: yup
    .string()
    .required('Phone number is required')
    .matches(phoneRegExp, 'Please enter a valid 10-digit phone number'),
  altPhone: yup
    .string()
    .nullable()
    .matches(phoneRegExp, 'Please enter a valid 10-digit phone number')
    .notRequired(),
  addressLine1: yup.string().nullable(),
  addressLine2: yup.string().nullable(),
  addressLine3: yup.string().nullable(),
  city: yup.string().nullable(),
  state: yup.string().nullable(),
  pincode: yup.string().nullable().matches(/^\d{6}$/, 'Pincode must be 6 digits'),
  
  // Academic info
  batch: yup.string().nullable(),
  section: yup.string().nullable(),
  semester: yup.number().nullable().typeError('Semester must be a number'),
  subjectsTaught: yup.array().of(yup.number()).nullable(),
});

// Test the password validator
export const testPasswordValidator = (password: string): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  let valid = true;
  
  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
    valid = false;
  }
  
  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
    valid = false;
  }
  
  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
    valid = false;
  }
  
  // Number check
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
    valid = false;
  }
  
  // Special character check
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
    valid = false;
  }
  
  return { valid, errors };
};
