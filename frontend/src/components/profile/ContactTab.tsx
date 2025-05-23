import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Grid,
  Button
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { contactInfoSchema } from '../../validation/profile';
// Auth context will be used in future updates

interface ContactTabProps {
  profileData: any;
  isOwnProfile: boolean;
  onUpdate: (data: any) => Promise<void>;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
}

export const ContactTab: React.FC<ContactTabProps> = ({ 
  profileData, 
  isOwnProfile, 
  onUpdate,
  isDirty,
  setIsDirty
}) => {
  // Using auth context for future role-based features
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // All users can edit their contact information based on requirements
  const canEditContactFields = isOwnProfile;
  
  const { 
    control, 
    handleSubmit, 
    formState: { errors }, 
    reset,
    watch
  } = useForm({
    resolver: yupResolver(contactInfoSchema),
    defaultValues: {
      phone: profileData?.phone || '',
      altPhone: profileData?.altPhone || '',
      addressLine1: profileData?.addressLine1 || profileData?.permanentAddress || '',
      addressLine2: profileData?.addressLine2 || '',
      addressLine3: profileData?.addressLine3 || '',
      city: profileData?.city || '',
      state: profileData?.state || '',
      pincode: profileData?.pincode || '',
    },
    mode: 'onChange'
  });

  // Handle saving changes
  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await onUpdate(data);
      setIsDirty(false);
    } catch (error) {
      console.error('Error updating contact info:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancelling changes
  const handleCancel = () => {
    reset({
      phone: profileData?.phone || '',
      altPhone: profileData?.altPhone || '',
      addressLine1: profileData?.addressLine1 || profileData?.permanentAddress || '',
      addressLine2: profileData?.addressLine2 || '',
      addressLine3: profileData?.addressLine3 || '',
      city: profileData?.city || '',
      state: profileData?.state || '',
      pincode: profileData?.pincode || '',
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
        <Grid item xs={12} sm={6}>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Phone Number *"
                fullWidth
                variant="outlined"
                error={!!errors.phone}
                helperText={errors.phone?.message as string}
                disabled={!canEditContactFields || isSubmitting}
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
            name="altPhone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Alternate Phone"
                fullWidth
                variant="outlined"
                error={!!errors.altPhone}
                helperText={errors.altPhone?.message as string}
                disabled={!canEditContactFields || isSubmitting}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  field.onChange(e);
                  setIsDirty(true);
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="addressLine1"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Address Line 1"
                fullWidth
                variant="outlined"
                error={!!errors.addressLine1}
                helperText={errors.addressLine1?.message as string}
                disabled={!canEditContactFields || isSubmitting}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  field.onChange(e);
                  setIsDirty(true);
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="addressLine2"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Address Line 2"
                fullWidth
                variant="outlined"
                error={!!errors.addressLine2}
                helperText={errors.addressLine2?.message as string}
                disabled={!canEditContactFields || isSubmitting}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  field.onChange(e);
                  setIsDirty(true);
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="addressLine3"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Address Line 3"
                fullWidth
                variant="outlined"
                error={!!errors.addressLine3}
                helperText={errors.addressLine3?.message as string}
                disabled={!canEditContactFields || isSubmitting}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  field.onChange(e);
                  setIsDirty(true);
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="City"
                fullWidth
                variant="outlined"
                error={!!errors.city}
                helperText={errors.city?.message as string}
                disabled={!canEditContactFields || isSubmitting}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  field.onChange(e);
                  setIsDirty(true);
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="State"
                fullWidth
                variant="outlined"
                error={!!errors.state}
                helperText={errors.state?.message as string}
                disabled={!canEditContactFields || isSubmitting}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  field.onChange(e);
                  setIsDirty(true);
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Controller
            name="pincode"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Pincode"
                fullWidth
                variant="outlined"
                error={!!errors.pincode}
                helperText={errors.pincode?.message as string}
                disabled={!canEditContactFields || isSubmitting}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  field.onChange(e);
                  setIsDirty(true);
                }}
              />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ContactTab;
