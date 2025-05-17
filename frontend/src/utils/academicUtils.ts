/**
 * Academic year utility functions
 */

/**
 * Gets the current academic year in the format "YYYY-YY"
 * Academic year typically starts in July/August and ends in May/June of the next year
 */
export const getCurrentAcademicYear = (): string => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
  
  // If current month is after June (July onwards), academic year starts in current year
  // Otherwise, academic year started in previous year
  const academicYearStart = currentMonth >= 7 ? currentYear : currentYear - 1;
  const academicYearEnd = academicYearStart + 1;
  
  // Format as YYYY-YY (e.g., 2024-25)
  return `${academicYearStart}-${(academicYearEnd % 100).toString().padStart(2, '0')}`;
};

/**
 * Gets a list of academic year options for dropdown menus
 * 
 * @param pastYears Number of past years to include
 * @param futureYears Number of future years to include
 * @returns Array of academic years in the format "YYYY-YY"
 */
export const getAcademicYearOptions = (pastYears = 1, futureYears = 1): string[] => {
  const currentAcademicYear = getCurrentAcademicYear();
  const [startYearStr] = currentAcademicYear.split('-');
  const startYear = parseInt(startYearStr);
  
  const options: string[] = [];
  for (let i = -pastYears; i <= futureYears; i++) {
    const year = startYear + i;
    const nextYear = year + 1;
    options.push(`${year}-${(nextYear % 100).toString().padStart(2, '0')}`);
  }
  
  return options;
};
