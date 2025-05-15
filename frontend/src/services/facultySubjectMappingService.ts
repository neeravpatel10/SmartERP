import axios from 'axios';

// Fix API URL to avoid duplicate /api prefix issues
const API_URL = `faculty-subject-mapping`;

/**
 * Service for handling faculty-subject mapping API requests
 */
export const facultySubjectMappingService = {
  /**
   * Get all faculty-subject mappings with optional filters
   */
  getAllMappings: async (filters = {}) => {
    try {
      const response = await axios.get(API_URL, { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching faculty-subject mappings:', error);
      throw error;
    }
  },

  /**
   * Get a specific mapping by ID
   */
  getMappingById: async (id: number) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching faculty-subject mapping with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new faculty-subject mapping
   */
  createMapping: async (mappingData: any) => {
    try {
      const response = await axios.post(API_URL, mappingData);
      return response.data;
    } catch (error) {
      console.error('Error creating faculty-subject mapping:', error);
      throw error;
    }
  },

  /**
   * Update mapping status (active/inactive)
   */
  updateMappingStatus: async (id: number, active: boolean) => {
    try {
      const response = await axios.put(`${API_URL}/status/${id}`, { active });
      return response.data;
    } catch (error) {
      console.error(`Error updating status of faculty-subject mapping with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get students for a specific mapping
   */
  getStudentsForMapping: async (id: number) => {
    try {
      const response = await axios.get(`${API_URL}/${id}/students`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching students for faculty-subject mapping with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a mapping (only for unused mappings)
   */
  deleteMapping: async (id: number) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting faculty-subject mapping with ID ${id}:`, error);
      throw error;
    }
  }
};
