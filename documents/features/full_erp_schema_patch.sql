
-- ===================================
-- ALTER EXISTING TABLES
-- ===================================



-- STUDENTS
ALTER TABLE students
MODIFY COLUMN usn VARCHAR(20) PRIMARY KEY,
ADD COLUMN semester INT,
ADD COLUMN section VARCHAR(10),
ADD COLUMN batch_id INT,
ADD COLUMN department_id INT;

-- FACULTY
ALTER TABLE faculty
ADD COLUMN department_id INT;

-- DEPARTMENTS
ALTER TABLE departments
MODIFY COLUMN department_code VARCHAR(10) UNIQUE,
MODIFY COLUMN department_name VARCHAR(100),
ADD COLUMN hod_name VARCHAR(100);

-- BATCHES
ALTER TABLE batches
ADD COLUMN current_semester INT DEFAULT 1,
ADD COLUMN auto_rollover BOOLEAN DEFAULT FALSE,
ADD COLUMN archived BOOLEAN DEFAULT FALSE;

-- SUBJECTS
ALTER TABLE subjects
ADD COLUMN category_id INT,
ADD COLUMN scheme_year INT,
ADD COLUMN is_lab BOOLEAN DEFAULT FALSE,
ADD COLUMN credits INT,
ADD COLUMN status ENUM('draft', 'active', 'locked', 'archived') DEFAULT 'draft',
ADD COLUMN locked_at TIMESTAMP,
ADD COLUMN archived_at TIMESTAMP;

-- MARKS
ALTER TABLE marks
ADD COLUMN attendance_percent DECIMAL(5,2),
ADD COLUMN is_finalized BOOLEAN DEFAULT FALSE,
ADD COLUMN calculated_on TIMESTAMP;

-- ===================================
-- CREATE NEW TABLES
-- ===================================

-- FACULTY SUBJECT MAPPING
CREATE TABLE IF NOT EXISTS faculty_subject_mapping (
  id INT PRIMARY KEY AUTO_INCREMENT,
  faculty_id INT NOT NULL,
  subject_id INT NOT NULL,
  semester INT NOT NULL,
  section VARCHAR(10) NOT NULL,
  batch_id INT NOT NULL,
  component_scope ENUM('theory', 'lab', 'both') DEFAULT 'theory',
  is_primary BOOLEAN DEFAULT TRUE,
  active BOOLEAN DEFAULT TRUE,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  approved_by INT,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SUBJECT STATUS LOG
CREATE TABLE IF NOT EXISTS subject_status_log (
  log_id INT PRIMARY KEY AUTO_INCREMENT,
  subject_id INT,
  status ENUM('draft', 'active', 'locked', 'archived'),
  changed_by INT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AUDIT LOG
CREATE TABLE IF NOT EXISTS audit_log (
  audit_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  role ENUM('student', 'faculty', 'dept_admin', 'super_admin') NOT NULL,
  action_type VARCHAR(100),
  entity_type VARCHAR(100),
  entity_id VARCHAR(100),
  details TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SUBJECT CATEGORIES
CREATE TABLE IF NOT EXISTS subject_categories (
  category_id INT PRIMARY KEY AUTO_INCREMENT,
  category_code VARCHAR(20) NOT NULL,
  category_name VARCHAR(100) NOT NULL
);

-- IA QUESTION CONFIG
CREATE TABLE IF NOT EXISTS ia_question_config (
  config_id INT PRIMARY KEY AUTO_INCREMENT,
  subject_id INT NOT NULL,
  cie_type ENUM('CIE I', 'CIE II') NOT NULL,
  question_number INT NOT NULL,
  subpart VARCHAR(10),
  part ENUM('A', 'B') DEFAULT NULL,
  max_marks INT NOT NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ASSIGNMENT CONFIG
CREATE TABLE IF NOT EXISTS assignment_config (
  assignment_id INT PRIMARY KEY AUTO_INCREMENT,
  subject_id INT NOT NULL,
  assignment_name VARCHAR(100) NOT NULL,
  max_marks INT NOT NULL,
  weightage DECIMAL(5,2),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
