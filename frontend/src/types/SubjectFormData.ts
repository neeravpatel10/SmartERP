export interface SubjectFormData {
  code: string;
  name: string;
  semester: number;
  credits: number;
  isLab: boolean;
  departmentId: number;
  categoryId?: number | null;
  status?: 'draft' | 'active' | 'locked' | 'archived';
  schemeYear?: number;
  section?: string;
  sectionId?: number;
} 