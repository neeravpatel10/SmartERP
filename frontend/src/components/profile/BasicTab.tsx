import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Select, 
  Grid,
  FormHelperText,
  Button,
  Chip,
  Typography
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { basicInfoSchema } from '../../validation/profile';
import { useAuth } from '../../contexts/AuthContext';

interface BasicTabProps {
  profileData: any;
  isOwnProfile: boolean;
  onUpdate: (data: any) => Promise<void>;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
}

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

// Department options with corrected data
const departmentOptions = [
  { id: 1, name: 'Computer Science & Engineering' },
  { id: 2, name: 'Electronics & Communication' },
  { id: 3, name: 'Mechanical' },
  { id: 4, name: 'Civil' },
  { id: 5, name: 'Information Technology' },
];

export const BasicTab: React.FC<BasicTabProps> = ({ 
  profileData, 
  isOwnProfile, 
  onUpdate,
  isDirty,
  setIsDirty
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Determine field editability based on user role
  const isStudent = user?.loginType === -1;
  const isFaculty = user?.loginType === 2 || user?.loginType === 3; // Faculty or dept-admin
  // const isDeptAdmin = user?.loginType === 3; // Commented out as it's currently unused
  const isSuperAdmin = user?.loginType === 1;
  
  // Check if current field is editable based on role and permissions matrix
  const canEditName = !isStudent && isOwnProfile;
  const canEditPreferredName = !isStudent && isOwnProfile;
  // Only Super Admins can edit departments now
  // const canEditDepartment = (isDeptAdmin || isSuperAdmin) && isOwnProfile;
  const canEditBasicFields = isOwnProfile;
  // canEditLoginInfo is reserved for future use
  
  // Debug log for profile data
  useEffect(() => {
    console.log('BasicTab received profile data:', profileData);
  }, [profileData]);

  const { 
    control, 
    handleSubmit, 
    formState: { errors }, 
    reset,
    setValue,
    watch
  } = useForm({
    resolver: yupResolver(basicInfoSchema),
    defaultValues: {
      name: profileData?.name || profileData?.username || '',
      preferredName: profileData?.preferredName || '',
      email: profileData?.email || '',
      departmentId: profileData?.departmentId || null,
      designation: profileData?.designation || '',
      dateOfBirth: profileData?.dateOfBirth ? new Date(profileData.dateOfBirth) : null,
      gender: profileData?.gender || '',
    },
    mode: 'onChange'
  });
  
  // Debug the profile data to help identify issues
  useEffect(() => {
    if (profileData) {
      console.log('Profile data for form update:', {
        departmentId: profileData.departmentId,
        departmentName: profileData.department?.name,
        fullProfileData: profileData
      });
    }
  }, [profileData]);

  // Update form when profile data changes
  useEffect(() => {
    if (profileData) {
      // Set all form fields with data from the profile
      setValue('name', profileData.name || profileData.username || '');
      setValue('preferredName', profileData.preferredName || '');
      setValue('email', profileData.email || '');
      
      // Make sure the department ID is correctly set
      if (profileData.department) {
        // Find the department in our options that matches the name
        const deptOption = departmentOptions.find(d => 
          d.name.toLowerCase() === profileData.department.name.toLowerCase());
        
        if (deptOption) {
          console.log('Found matching department:', deptOption);
          setValue('departmentId', deptOption.id);
        } else {
          // Fallback to the departmentId if we can't match by name
          console.log('Using fallback departmentId:', profileData.departmentId);
          setValue('departmentId', profileData.departmentId || null);
        }
      } else {
        setValue('departmentId', profileData.departmentId || null);
      }
      
      setValue('designation', profileData.designation || '');
      setValue('dateOfBirth', profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : null);
      setValue('gender', profileData.gender || '');
    }
  }, [profileData, setValue, departmentOptions]);

  // Handle saving changes
  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await onUpdate(data);
      setIsDirty(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancelling changes
  const handleCancel = () => {
    reset({
      name: profileData?.name || '',
      preferredName: profileData?.preferredName || '',
      email: profileData?.email || '',
      departmentId: profileData?.departmentId || null,
      designation: profileData?.designation || '',
      dateOfBirth: profileData?.dateOfBirth ? new Date(profileData.dateOfBirth) : null,
      gender: profileData?.gender || '',
    });
    setIsDirty(false);
  };

  // Update dirty state when form changes
  React.useEffect(() => {
    const subscription = watch((_, info: { name?: string, type?: any }) => {
      if (info.type) {
        setIsDirty(true);
      }
    });
    
    // Proper cleanup for React Hook Form subscription
    return () => {
      if (subscription && typeof subscription === 'function') {
        subscription();
      } else if (subscription && typeof subscription === 'object') {
        // Use type assertion for compatibility
        const sub = subscription as { unsubscribe?: () => void };
        if (sub.unsubscribe) sub.unsubscribe();
      }
    };
  }, [watch, setIsDirty]);

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ pt: 2 }}>
      {/* Action buttons */}
      {isDirty && (
        <Box 
          sx={{ 
            position: 'sticky', 
            top: 0, 
            display: 'flex', 
            justifyContent: 'flex-end',
            py: 2,
            px: 2,
            bgcolor: 'white',
            zIndex: 10,
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={handleCancel}
            disabled={isSubmitting}
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={isSubmitting}
          >
            Save Changes
          </Button>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Full Name */}
        <Grid item xs={12} sm={6}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Full Name"
                fullWidth
                variant="outlined"
                error={!!errors.name}
                helperText={errors.name?.message as string}
                disabled={!canEditName || isSubmitting}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  field.onChange(e);
                  setIsDirty(true);
                }}
                InputLabelProps={{ shrink: !!field.value }}
              />
            )}
          />
        </Grid>

        {/* Preferred Name */}
        <Grid item xs={12} sm={6}>
          <Controller
            name="preferredName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Preferred Name"
                fullWidth
                variant="outlined"
                error={!!errors.preferredName}
                helperText={errors.preferredName?.message as string}
                disabled={!canEditPreferredName || isSubmitting}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  field.onChange(e);
                  setIsDirty(true);
                }}
                InputLabelProps={{ shrink: !!field.value }}
              />
            )}
          />
        </Grid>

        {/* Email/USN Field */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="Email / USN"
            fullWidth
            variant="outlined"
            value={profileData?.email || profileData?.usn || ''}
            disabled={true}
            InputProps={{
              readOnly: true,
            }}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          {isSuperAdmin && isOwnProfile ? (
            <Controller
              name="departmentId"
              control={control}
              render={({ field }) => (
                <FormControl 
                  fullWidth 
                  variant="outlined"
                  error={!!errors.departmentId}
                  disabled={isSubmitting}
                >
                  <InputLabel shrink={!!field.value}>Department</InputLabel>
                  <Select
                    {...field}
                    label="Department"
                    value={field.value || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      field.onChange(e);
                      setIsDirty(true);
                    }}
                    displayEmpty
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300
                        }
                      }
                    }}
                  >
                    <MenuItem value="" disabled>
                      <em>Select Department</em>
                    </MenuItem>
                    {departmentOptions.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.departmentId && (
                    <FormHelperText>{errors.departmentId.message as string}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
          ) : (
            <TextField
              label="Department"
              fullWidth
              variant="outlined"
              value={profileData?.department?.name || 'Not Assigned'}
              disabled={true}
              InputProps={{
                readOnly: true,
              }}
              InputLabelProps={{ shrink: true }}
            />
          )}
        </Grid>

        {/* Designation - only for faculty/admin */}
        <Grid item xs={12} sm={6}>
          <Controller
            name="designation"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Designation"
                fullWidth
                variant="outlined"
                error={!!errors.designation}
                helperText={errors.designation?.message as string}
                disabled={!(isFaculty && isOwnProfile) || isSubmitting}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  field.onChange(e);
                  setIsDirty(true);
                }}
                InputLabelProps={{ shrink: !!field.value }}
              />
            )}
          />
        </Grid>

        {/* Gender field */}
        <Grid item xs={12} sm={6}>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <FormControl 
                fullWidth 
                variant="outlined"
                error={!!errors.gender}
                disabled={!canEditBasicFields || isSubmitting}
              >
                <InputLabel shrink={!!field.value}>Gender</InputLabel>
                <Select
                  {...field}
                  label="Gender"
                  value={field.value || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    field.onChange(e);
                    setIsDirty(true);
                  }}
                  displayEmpty
                >
                  <MenuItem value="" disabled><em>Select Gender</em></MenuItem>
                  {genderOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.gender && (
                  <FormHelperText>{errors.gender.message as string}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>

        {/* Date of Birth */}
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Controller
              name="dateOfBirth"
              control={control}
              render={({ field }: { field: any }) => (
                <DatePicker
                  label="Date of Birth"
                  value={field.value}
                  onChange={(date) => {
                    field.onChange(date);
                    setIsDirty(true);
                  }}
                  disabled={!canEditBasicFields || isSubmitting}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'outlined',
                      error: !!errors.dateOfBirth,
                      helperText: errors.dateOfBirth?.message as string,
                      InputLabelProps: { shrink: true }
                    },
                  }}
                />
              )}
            />
          </LocalizationProvider>
        </Grid>

        {/* Phone number - show if available */}
        {profileData?.phone && (
          <Grid item xs={12} sm={6}>
            <TextField
              label="Phone Number"
              fullWidth
              variant="outlined"
              value={profileData.phone || ''}
              disabled={true}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        )}

        {/* Additional student-specific fields */}
        {user?.loginType === -1 && profileData?.student && (
          <>
            {/* Batch information */}
            {profileData.batchName && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Batch"
                  fullWidth
                  variant="outlined"
                  value={profileData.batchName}
                  disabled={true}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}
            
            {/* Semester information */}
            {profileData.semesterName && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Semester"
                  fullWidth
                  variant="outlined"
                  value={profileData.semesterName}
                  disabled={true}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}
            
            {/* Section information */}
            {profileData.sectionName && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Section"
                  fullWidth
                  variant="outlined"
                  value={profileData.sectionName}
                  disabled={true}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}
          </>
        )}

        {/* Faculty-specific fields */}
        {(user?.loginType === 2 || user?.loginType === 3) && profileData?.faculty && (
          <>
            {/* Qualification */}
            {profileData.qualification && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Qualification"
                  fullWidth
                  variant="outlined"
                  value={profileData.qualification}
                  disabled={true}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}
            
            {/* Experience */}
            {profileData.experience && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Experience (Years)"
                  fullWidth
                  variant="outlined"
                  value={profileData.experience}
                  disabled={true}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}
          </>
        )}

        {/* Role information */}
        <Grid item xs={12}>
          <Box sx={{ mt: 3, mb: 1 }}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Account Information
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                label={
                  user?.loginType === -1 ? 'Student' : 
                  user?.loginType === 2 ? 'Faculty' :
                  user?.loginType === 3 ? 'Department Admin' :
                  user?.loginType === 1 ? 'Super Admin' : 'Unknown'
                }
                color={
                  user?.loginType === -1 ? 'default' : 
                  user?.loginType === 2 ? 'primary' :
                  user?.loginType === 3 ? 'secondary' :
                  user?.loginType === 1 ? 'error' : 'default'
                }
                size="small"
              />
              
              {/* Department chip */}
              {profileData?.department && (
                <Chip 
                  label={profileData.department.name}
                  color="info"
                  size="small"
                />
              )}
              
              {/* Created date chip */}
              {profileData?.createdAt && (
                <Chip 
                  label={`Joined: ${new Date(profileData.createdAt).toLocaleDateString()}`}
                  variant="outlined"
                  size="small"
                />
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BasicTab;
