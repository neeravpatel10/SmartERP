/**
 * Helper utility functions used across controllers
 */

/**
 * Calculate attendance percentage
 * @param present Number of sessions present
 * @param total Total number of sessions
 * @returns Percentage rounded to 2 decimal places
 */
export const calculateAttendancePercentage = (present: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((present / total) * 100 * 100) / 100;
};

/**
 * Format date to YYYY-MM-DD
 * @param date Date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Get current academic year (e.g., "2023-2024")
 * @returns Current academic year string
 */
export const getCurrentAcademicYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Academic year typically starts in August/September
  if (month >= 7) { // August or later
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

/**
 * Generate a random alphanumeric string
 * @param length Length of the string to generate
 * @returns Random string
 */
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Parse a CSV string into an array of objects
 * @param csvString CSV data as string
 * @param delimiter Column delimiter (default: comma)
 * @returns Array of objects where keys are from header row
 */
export const parseCsv = (csvString: string, delimiter: string = ','): Record<string, string>[] => {
  const lines = csvString.split('\n');
  const result: Record<string, string>[] = [];
  
  // Get header row
  const headers = lines[0].split(delimiter).map(header => header.trim());
  
  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(delimiter);
    const obj: Record<string, string> = {};
    
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[j]?.trim() || '';
    }
    
    result.push(obj);
  }
  
  return result;
};

/**
 * Convert CSV data to JSON
 * @param csvData CSV data as string
 * @param options Options for parsing
 * @returns Parsed JSON data
 */
export const csvToJson = (
  csvData: string, 
  options: { 
    delimiter?: string;
    skipEmptyLines?: boolean;
    headers?: string[];
  } = {}
): any[] => {
  const { 
    delimiter = ',', 
    skipEmptyLines = true,
    headers
  } = options;
  
  const lines = csvData.split('\n');
  const result: any[] = [];
  
  // Determine headers
  const headerRow = headers || lines[0].split(delimiter).map(h => h.trim());
  const startRow = headers ? 0 : 1;
  
  // Process data rows
  for (let i = startRow; i < lines.length; i++) {
    const line = lines[i].trim();
    if (skipEmptyLines && !line) continue;
    
    const values = line.split(delimiter).map(v => v.trim());
    const row: Record<string, any> = {};
    
    headerRow.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    result.push(row);
  }
  
  return result;
}; 