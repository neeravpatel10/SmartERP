import React, { useEffect, useState, ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';

interface StudentFormProps {
  mode: 'create' | 'edit';
}

interface Address {
  type: 'present' | 'permanent';
  state?: string;
  district?: string;
  houseName?: string;
  village?: string;
  pincode?: string;
}

interface Guardian {
  type: 'father' | 'mother' | 'guardian';
  name?: string;
  contact?: string;
  aadhar?: string;
  panCard?: string;
  occupation?: string;
}

interface EntranceExam {
  kcetRank?: string;
  comedkRank?: string;
  jeeRank?: string;
}

interface PucDetails {
  school: string;
  boardUniversity: string;
  regNo: string;
  year: string;
  percentage: string;
  physicsMax: string;
  physicsObtained: string;
  chemistryMax: string;
  chemistryObtained: string;
  mathsMax: string;
  mathsObtained: string;
  englishMax: string;
  englishObtained: string;
  electiveMax: string;
  electiveObtained: string;
  obtainedMarks: string;
  maxMarks: string;
  chemObtained?: string;
  chemMax?: string;
}

interface StudentData {
  usn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: number;
  batchId: string;
  semester: number;
  section: string;
  admissionYear: number;
  dob?: string;
  department?: {
    id: number;
    name: string;
    code: string;
  };
  batch?: {
    id: string;
    name: string;
    academicYear: string;
  };
  addresses: Address[];
  guardians: Guardian[];
  entranceExams?: EntranceExam;
  sslcDetails?: {
    school: string;
    boardUniversity: string;
    regNo: string;
    year: string;
    percentage: string;
    maxMarks: string;
    obtainedMarks: string;
  };
  pucDetails?: PucDetails;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Batch {
  id: string;
  name: string;
  academicYear: string;
}

const StudentForm: React.FC<StudentFormProps> = ({ mode }) => {
  const { usn } = useParams<{ usn: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [studentData, setStudentData] = useState<StudentData>({
    usn: '',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: 0,
    batchId: '',
    semester: 1,
    section: '',
    admissionYear: new Date().getFullYear(),
    addresses: [
      { type: 'present' },
      { type: 'permanent' }
    ],
    guardians: [
      { type: 'father' },
      { type: 'mother' },
      { type: 'guardian' }
    ],
    entranceExams: {
      kcetRank: '',
      comedkRank: '',
      jeeRank: ''
    }
  });

  // Fetch departments and batches
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptResponse, batchResponse] = await Promise.all([
          api.get('/departments'),
          api.get('/batches')
        ]);

        if (deptResponse.data.success) {
          setDepartments(deptResponse.data.data.departments || []);
        }
        if (batchResponse.data.success) {
          setBatches(batchResponse.data.data.batches || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load required data');
      }
    };
    fetchData();
  }, []);

  // Fetch student data if in edit mode
  useEffect(() => {
    const fetchStudentData = async () => {
      if (mode === 'edit' && usn) {
        setLoading(true);
        try {
          const response = await api.get(`/students/${usn}`);
          if (response.data.success) {
            const student = response.data.data;
            console.log('Fetched student data:', student);

            const getBestGuardian = (guardians: Guardian[], type: 'father' | 'mother' | 'guardian'): Guardian => {
              const filtered = guardians.filter(g => g.type === type);
              if (filtered.length === 0) return { type };
              // Pick the one with the most non-empty fields
              return filtered.reduce((best, curr) => {
                const bestScore = Object.values(best).filter(Boolean).length;
                const currScore = Object.values(curr).filter(Boolean).length;
                return currScore > bestScore ? curr : best;
              });
            };

            const uniqueGuardians = [
              getBestGuardian(student.guardians, 'father'),
              getBestGuardian(student.guardians, 'mother')
            ];
            
            // Ensure we have all required data
            const formattedStudent = {
              usn: student.usn,
              firstName: student.firstName,
              middleName: student.middleName || '',
              lastName: student.lastName,
              email: student.email,
              phone: student.phone,
              departmentId: student.departmentId,
              batchId: student.batchId,
              semester: student.semester,
              section: student.section,
              admissionYear: student.admissionYear,
              department: student.department,
              batch: student.batch,
              addresses: student.addresses?.length ? student.addresses : [
                { type: 'present' },
                { type: 'permanent' }
              ],
              guardians: uniqueGuardians,
              dob: student.dob || undefined,
              entranceExams: Array.isArray(student.entranceExams) && student.entranceExams.length > 0
                ? student.entranceExams[0]
                : { kcetRank: '', comedkRank: '', jeeRank: '' },
              sslcDetails: student.sslcDetails,
              pucDetails: student.pucDetails
            };

            setStudentData(formattedStudent);
          } else {
            setError('Failed to fetch student data');
          }
        } catch (err) {
          console.error('Error fetching student:', err);
          setError('Error fetching student data');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchStudentData();
  }, [mode, usn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Prepare data to send, only include dob if valid
    const dataToSend = { 
      ...studentData,
      // Convert string values to appropriate types
      departmentId: typeof studentData.departmentId === 'string' ? 
                    parseInt(studentData.departmentId) : studentData.departmentId,
      semester: typeof studentData.semester === 'string' ? 
               parseInt(studentData.semester) : studentData.semester,
      admissionYear: typeof studentData.admissionYear === 'string' ? 
                    parseInt(studentData.admissionYear) : studentData.admissionYear
    };
    
    if (!dataToSend.dob || isNaN(new Date(dataToSend.dob as any).getTime())) {
      delete dataToSend.dob;
    }
    console.log('DATA TO SEND:', dataToSend);

    try {
      const endpoint = mode === 'edit' ? `/students/${usn}` : '/students';
      const method = mode === 'edit' ? 'put' : 'post';
      
      const response = await api({
        method,
        url: endpoint,
        data: dataToSend
      });

      if (response.data.success) {
        navigate('/students');
      } else {
        setError(response.data.message || 'Failed to save student');
      }
    } catch (err: any) {
      console.error('Error saving student:', err);
      setError(err.response?.data?.message || 'Error saving student data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setStudentData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleAddressChange = (type: 'present' | 'permanent', field: keyof Address, value: string) => {
    setStudentData(prev => ({
      ...prev,
      addresses: prev.addresses.map(addr => 
        addr.type === type ? { ...addr, [field]: value } : addr
      )
    }));
  };

  const handleGuardianChange = (type: 'father' | 'mother' | 'guardian', field: keyof Guardian, value: string) => {
    setStudentData(prev => ({
      ...prev,
      guardians: prev.guardians.map(guardian => 
        guardian.type === type ? { ...guardian, [field]: value } : guardian
      )
    }));
  };

  const handleEntranceExamChange = (field: keyof EntranceExam, value: string) => {
    setStudentData(prev => ({
      ...prev,
      entranceExams: {
        ...prev.entranceExams,
        [field]: value
      }
    }));
  };

  if (loading && mode === 'edit') {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {mode === 'create' ? 'Add New Student' : 'Edit Student'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {/* Basic Details Section */}
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Basic Details
          </Typography>
          <Grid container spacing={3}>
            {mode === 'create' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  name="usn"
                  label="USN"
                  value={studentData.usn}
                  onChange={handleChange}
                />
              </Grid>
            )}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                name="firstName"
                label="First Name"
                value={studentData.firstName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                name="middleName"
                label="Middle Name"
                value={studentData.middleName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                name="lastName"
                label="Last Name"
                value={studentData.lastName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="email"
                type="email"
                label="Email"
                value={studentData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="phone"
                label="Phone"
                value={studentData.phone}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Academic Details Section */}
          <Typography variant="h6" gutterBottom>
            Academic Details
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Department</InputLabel>
                <Select
                  name="departmentId"
                  value={studentData.departmentId}
                  onChange={handleChange}
                  label="Department"
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.code} - {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Batch</InputLabel>
                <Select
                  name="batchId"
                  value={studentData.batchId}
                  onChange={handleChange}
                  label="Batch"
                >
                  {batches.map((batch) => (
                    <MenuItem key={batch.id} value={batch.id}>
                      {batch.name} ({batch.academicYear})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                name="semester"
                label="Semester"
                type="number"
                InputProps={{ inputProps: { min: 1, max: 8 } }}
                value={studentData.semester}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                name="section"
                label="Section"
                value={studentData.section}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                name="admissionYear"
                label="Admission Year"
                type="number"
                value={studentData.admissionYear}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Address Section */}
          <Typography variant="h6" gutterBottom>
            Present Address
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="House Name"
                value={studentData.addresses.find(a => a.type === 'present')?.houseName || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleAddressChange('present', 'houseName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Village/City"
                value={studentData.addresses.find(a => a.type === 'present')?.village || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleAddressChange('present', 'village', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="District"
                value={studentData.addresses.find(a => a.type === 'present')?.district || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleAddressChange('present', 'district', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State"
                value={studentData.addresses.find(a => a.type === 'present')?.state || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleAddressChange('present', 'state', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Pincode"
                value={studentData.addresses.find(a => a.type === 'present')?.pincode || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleAddressChange('present', 'pincode', e.target.value)}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Permanent Address
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="House Name"
                value={studentData.addresses.find(a => a.type === 'permanent')?.houseName || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleAddressChange('permanent', 'houseName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Village/City"
                value={studentData.addresses.find(a => a.type === 'permanent')?.village || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleAddressChange('permanent', 'village', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="District"
                value={studentData.addresses.find(a => a.type === 'permanent')?.district || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleAddressChange('permanent', 'district', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State"
                value={studentData.addresses.find(a => a.type === 'permanent')?.state || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleAddressChange('permanent', 'state', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Pincode"
                value={studentData.addresses.find(a => a.type === 'permanent')?.pincode || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleAddressChange('permanent', 'pincode', e.target.value)}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Family Details Section - DYNAMIC */}
          <Typography variant="h6" gutterBottom>
            Family Details
          </Typography>

          {studentData.guardians && studentData.guardians.length > 0 && studentData.guardians.map((guardian, idx) => (
            <Box key={idx} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: idx === 0 ? 2 : 3 }}>
                {guardian.type.charAt(0).toUpperCase() + guardian.type.slice(1)}'s Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={guardian.name || ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleGuardianChange(guardian.type as 'father' | 'mother' | 'guardian', 'name', e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contact"
                    value={guardian.contact || ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleGuardianChange(guardian.type as 'father' | 'mother' | 'guardian', 'contact', e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Aadhar Number"
                    value={guardian.aadhar || ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleGuardianChange(guardian.type as 'father' | 'mother' | 'guardian', 'aadhar', e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="PAN Card"
                    value={guardian.panCard || ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleGuardianChange(guardian.type as 'father' | 'mother' | 'guardian', 'panCard', e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Occupation"
                    value={guardian.occupation || ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleGuardianChange(guardian.type as 'father' | 'mother' | 'guardian', 'occupation', e.target.value)
                    }
                  />
                </Grid>
              </Grid>
            </Box>
          ))}

          <Divider sx={{ my: 4 }} />

          {/* Previous Education Section */}
          <Typography variant="h6" gutterBottom>
            Previous Education
          </Typography>
          
          <Typography variant="subtitle1" gutterBottom>
            SSLC Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="School Name"
                name="sslcDetails.school"
                value={studentData.sslcDetails?.school || ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Board/University"
                name="sslcDetails.boardUniversity"
                value={studentData.sslcDetails?.boardUniversity || ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Register Number"
                name="sslcDetails.regNo"
                value={studentData.sslcDetails?.regNo || ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Year"
                name="sslcDetails.year"
                value={studentData.sslcDetails?.year || ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Percentage"
                name="sslcDetails.percentage"
                value={studentData.sslcDetails?.percentage || ''}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
            PUC Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="School Name"
                name="pucDetails.school"
                value={studentData.pucDetails?.school || ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Board/University"
                name="pucDetails.boardUniversity"
                value={studentData.pucDetails?.boardUniversity || ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Register Number"
                name="pucDetails.regNo"
                value={studentData.pucDetails?.regNo || ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Year"
                name="pucDetails.year"
                value={studentData.pucDetails?.year || ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Percentage"
                name="pucDetails.percentage"
                value={studentData.pucDetails?.percentage || ''}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Subject-wise Marks
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Physics Marks"
                    name="pucDetails.physicsObtained"
                    value={studentData.pucDetails?.physicsObtained || ''}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Chemistry Marks"
                    name="pucDetails.chemObtained"
                    value={studentData.pucDetails?.chemObtained || ''}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Chemistry Max Marks"
                    name="pucDetails.chemMax"
                    value={studentData.pucDetails?.chemMax || ''}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Mathematics Marks"
                    name="pucDetails.mathsObtained"
                    value={studentData.pucDetails?.mathsObtained || ''}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="English Marks"
                    name="pucDetails.englishObtained"
                    value={studentData.pucDetails?.englishObtained || ''}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Elective Marks"
                    name="pucDetails.electiveObtained"
                    value={studentData.pucDetails?.electiveObtained || ''}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Entrance Exam Details */}
          <Typography variant="h6" gutterBottom>
            Entrance Exam Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="KCET Rank"
                value={studentData.entranceExams?.kcetRank || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleEntranceExamChange('kcetRank', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="COMEDK Rank"
                value={studentData.entranceExams?.comedkRank || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleEntranceExamChange('comedkRank', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="JEE Rank"
                value={studentData.entranceExams?.jeeRank || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleEntranceExamChange('jeeRank', e.target.value)}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/students')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Student' : 'Update Student'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default StudentForm; 