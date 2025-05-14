import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useApi } from '../../contexts/ApiCacheContext';

interface Department {
  id: number;
  name: string;
  code: string;
}

interface DepartmentSelectorProps {
  value: number | string | null;
  onChange: (departmentId: number | string) => void;
  required?: boolean;
  label?: string;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  disabled?: boolean;
}

/**
 * A reusable department selector component that uses cached API data
 */
const DepartmentSelector: React.FC<DepartmentSelectorProps> = ({
  value,
  onChange,
  required = false,
  label = 'Department',
  error = false,
  helperText,
  fullWidth = true,
  size = 'medium',
  disabled = false
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const { getCached } = useApi();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await getCached('/departments');
        if (response.data.success) {
          setDepartments(response.data.data.departments);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, [getCached]);

  return (
    <FormControl 
      fullWidth={fullWidth} 
      size={size} 
      required={required}
      error={error}
      disabled={disabled || loading}
    >
      <InputLabel id="department-select-label">{label}</InputLabel>
      <Select
        labelId="department-select-label"
        value={value || ''}
        label={label}
        onChange={(e: SelectChangeEvent) => {
          onChange(e.target.value as string | number);
        }}
      >
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {departments.map((dept) => (
          <MenuItem key={dept.id} value={dept.id}>
            {dept.code} - {dept.name}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default DepartmentSelector; 