import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  Grid,
  FormHelperText,
  Button,
  Chip,
  Typography,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { academicInfoSchema } from '../../validation/profile';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

interface AcademicTabProps {
  profileData: any;
  isOwnProfile: boolean;
  onUpdate: (data: any) => Promise<void>;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
}

export const AcademicTab: React.FC<AcademicTabProps> = ({ 
  profileData, 
  isOwnProfile, 
  onUpdate,
  isDirty,
  setIsDirty
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  
  // Determine field editability based on user role
  const isStudent = user?.loginType === -1;
  const isFaculty = user?.loginType === 2 || user?.loginType === 3; // Faculty or dept-admin
  const isDeptAdmin = user?.loginType === 3;
  const isSuperAdmin = user?.loginType === 1;
  
  // Check if current field is editable based on role and permissions matrix
  const canEditBatchSection = (isDeptAdmin || isSuperAdmin) && isOwnProfile;
  const canEditSubjects = (isDeptAdmin || isSuperAdmin) && isOwnProfile;
  
  const { 
    control, 
    handleSubmit, 
    formState: { errors }, 
    reset,
    watch,
    // setValue is reserved for future use
  } = useForm({
    resolver: yupResolver(academicInfoSchema),
    defaultValues: {
      batch: profileData?.batch || '',
      section: profileData?.section || '',
      semester: profileData?.semester || null,
      subjectsTaught: profileData?.subjectsTaught || [],
    },
    mode: 'onChange'
  });

  // Fetch subjects for faculty
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!isFaculty && !isDeptAdmin && !isSuperAdmin) return;
      
      setIsLoadingSubjects(true);
      try {
        const response = await api.get('/subjects');
        if (response.data.success) {
          // Normalize the response based on the structure
          const subjectsData = response.data.data?.subjects || 
                              response.data.data || 
                              response.data.subjects || 
                              [];
          setSubjects(subjectsData);
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
      } finally {
        setIsLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, [isFaculty, isDeptAdmin, isSuperAdmin]);

  // Handle saving changes
  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await onUpdate(data);
      setIsDirty(false);
    } catch (error) {
      console.error('Error updating academic info:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancelling changes
  const handleCancel = () => {
    reset({
      batch: profileData?.batch || '',
      section: profileData?.section || '',
      semester: profileData?.semester || null,
      subjectsTaught: profileData?.subjectsTaught || [],
    });
    setIsDirty(false);
  };

  // Update dirty state when form changes
  React.useEffect(() => {
    const subscription = watch((_, info: { name?: string, type?: any }) => {
      if (info.type) {
      // Type already checked above
        setIsDirty(true);
      }
    });
    // React Hook Form's watch returns different types in different versions
    // For compatibility, check if unsubscribe exists before calling it
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

  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 250,
      },
    },
  };

  // Student-specific display
  if (isStudent) {
    return (
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="textSecondary">Batch</Typography>
            <Typography variant="body1">{profileData?.batch || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="textSecondary">Section</Typography>
            <Typography variant="body1">{profileData?.section || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" color="textSecondary">Semester</Typography>
            <Typography variant="body1">{profileData?.semester || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Subjects</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {profileData?.subjects?.length > 0 ? (
                profileData.subjects.map((subject: any) => (
                  <Chip 
                    key={subject.id} 
                    label={`${subject.code}: ${subject.name}`} 
                    size="small" 
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">No subjects assigned</Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
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

      <Grid container spacing={2} sx={{ mt: 1 }}>
        {/* Faculty/Admin fields */}
        {(isFaculty || isDeptAdmin || isSuperAdmin) && (
          <>
            <Grid item xs={12} sm={6}>
              <Controller
                name="batch"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Batch"
                    fullWidth
                    variant="outlined"
                    error={!!errors.batch}
                    helperText={errors.batch?.message as string}
                    disabled={!canEditBatchSection || isSubmitting}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      field.onChange(e);
                      setIsDirty(true);
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="section"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Section"
                    fullWidth
                    variant="outlined"
                    error={!!errors.section}
                    helperText={errors.section?.message as string}
                    disabled={!canEditBatchSection || isSubmitting}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      field.onChange(e);
                      setIsDirty(true);
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="semester"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Semester"
                    fullWidth
                    variant="outlined"
                    type="number"
                    inputProps={{ min: 1, max: 8 }}
                    error={!!errors.semester}
                    helperText={errors.semester?.message as string}
                    disabled={!canEditBatchSection || isSubmitting}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      field.onChange(e.target.value ? Number(e.target.value) : null);
                      setIsDirty(true);
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="subjectsTaught"
                control={control}
                render={({ field }) => (
                  <FormControl 
                    fullWidth 
                    variant="outlined"
                    error={!!errors.subjectsTaught}
                    disabled={!canEditSubjects || isSubmitting || isLoadingSubjects}
                  >
                    <InputLabel>Subjects Taught</InputLabel>
                    <Select
                      {...field}
                      multiple
                      input={<OutlinedInput label="Subjects Taught" />}
                      renderValue={(selected: any) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value: any) => {
                            const subject = subjects.find(s => s.id === value);
                            return (
                              <Chip 
                                key={value} 
                                label={subject ? `${subject.code}: ${subject.name}` : value} 
                                size="small" 
                              />
                            );
                          })}
                        </Box>
                      )}
                      MenuProps={MenuProps}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        field.onChange(e);
                        setIsDirty(true);
                      }}
                    >
                      {isLoadingSubjects ? (
                        <MenuItem disabled>Loading subjects...</MenuItem>
                      ) : subjects.length > 0 ? (
                        subjects.map((subject) => (
                          <MenuItem key={subject.id} value={subject.id}>
                            <Checkbox checked={field.value.indexOf(subject.id) > -1} />
                            <ListItemText 
                              primary={`${subject.code}: ${subject.name}`} 
                              secondary={`Semester ${subject.semester}`} 
                            />
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No subjects available</MenuItem>
                      )}
                    </Select>
                    {errors.subjectsTaught && (
                      <FormHelperText>{errors.subjectsTaught.message as string}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};

export default AcademicTab;
