-- College ERP Database Schema
-- Generated on 2025-04-20 11:04:16

-- Database creation and selection
CREATE DATABASE IF NOT EXISTS college_erp;
USE college_erp;

-- ===================================
-- DEPARTMENTS (initial creation without HOD reference)
-- ===================================
CREATE TABLE departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  department_code VARCHAR(10) UNIQUE NOT NULL,
  department_name VARCHAR(100) NOT NULL,
  hod_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ===================================
-- BATCHES
-- ===================================
CREATE TABLE batches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  batch_name VARCHAR(20) NOT NULL,
  start_year YEAR NOT NULL,
  end_year YEAR NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE (start_year, end_year)
);

-- ===================================
-- FACULTY
-- ===================================
CREATE TABLE faculty (
  faculty_id INT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(15) NOT NULL,
  designation VARCHAR(100) NOT NULL,
  gender ENUM('Male', 'Female', 'Other') DEFAULT NULL,
  dob DATE,
  qualification VARCHAR(150),
  experience_years DECIMAL(4,1) DEFAULT 0.0,
  department_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- ===================================
-- Add HOD reference to departments now that faculty exists
-- ===================================
ALTER TABLE departments
ADD CONSTRAINT fk_departments_hod
FOREIGN KEY (hod_id) REFERENCES faculty(faculty_id) ON DELETE SET NULL;

-- ===================================
-- STUDENTS
-- ===================================
CREATE TABLE students (
  usn VARCHAR(20) PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(15) NOT NULL,
  dob DATE,
  gender ENUM('Male', 'Female', 'Other') DEFAULT NULL,
  address TEXT,
  batch_id INT NOT NULL,
  department_id INT NOT NULL,
  semester TINYINT NOT NULL,
  section CHAR(1),
  admission_year YEAR NOT NULL,
  father_name VARCHAR(100),
  mother_name VARCHAR(100),
  guardian_name VARCHAR(100),
  guardian_contact VARCHAR(15),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- ===================================
-- USERS
-- ===================================
CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role TINYINT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login DATETIME DEFAULT NULL,
  usn VARCHAR(20),
  faculty_id INT,
  FOREIGN KEY (usn) REFERENCES students(usn) ON DELETE CASCADE,
  FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id) ON DELETE CASCADE
);

-- ===================================
-- SUBJECT CATEGORIES
-- ===================================
CREATE TABLE subject_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(10) UNIQUE NOT NULL,
  description VARCHAR(100) NOT NULL,
  marks_logic_summary TEXT
);

-- ===================================
-- SUBJECTS
-- ===================================
CREATE TABLE subjects (
  subject_id INT PRIMARY KEY AUTO_INCREMENT,
  subject_code VARCHAR(20) UNIQUE NOT NULL,
  subject_name VARCHAR(150) NOT NULL,
  semester TINYINT NOT NULL CHECK (semester BETWEEN 1 AND 8),
  department_id INT NOT NULL,
  subject_category_id INT,
  credits TINYINT NOT NULL CHECK (credits > 0),
  is_lab BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_category_id) REFERENCES subject_categories(id) ON DELETE SET NULL
);

-- ===================================
-- FACULTY SUBJECT MAPPING
-- ===================================
CREATE TABLE faculty_subject_mapping (
  id INT PRIMARY KEY AUTO_INCREMENT,
  faculty_id INT NOT NULL,
  subject_id INT NOT NULL,
  section CHAR(1),
  semester TINYINT NOT NULL,
  batch_id INT NOT NULL,
  academic_year VARCHAR(9) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
  UNIQUE (faculty_id, subject_id, section, academic_year)
);

-- ===================================
-- ATTENDANCE SESSIONS
-- ===================================
CREATE TABLE attendance_sessions (
  session_id INT PRIMARY KEY AUTO_INCREMENT,
  subject_id INT NOT NULL,
  faculty_id INT,
  attendance_date DATE NOT NULL,
  session_slot TINYINT NOT NULL,
  academic_year VARCHAR(9) NOT NULL,
  semester TINYINT NOT NULL,
  section CHAR(1),
  batch_id INT,
  marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
  FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id) ON DELETE SET NULL,
  FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
  UNIQUE (subject_id, attendance_date, session_slot)
);

-- ===================================
-- ATTENDANCE ENTRIES
-- ===================================
CREATE TABLE attendance_entries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  usn VARCHAR(20) NOT NULL,
  status ENUM('Present', 'Absent', 'OD', 'Leave') NOT NULL DEFAULT 'Present',
  FOREIGN KEY (session_id) REFERENCES attendance_sessions(session_id) ON DELETE CASCADE,
  FOREIGN KEY (usn) REFERENCES students(usn) ON DELETE CASCADE,
  UNIQUE (session_id, usn)
);

-- ===================================
-- EXAM COMPONENTS
-- ===================================
CREATE TABLE exam_components (
  component_id INT PRIMARY KEY AUTO_INCREMENT,
  subject_id INT NOT NULL,
  component_name VARCHAR(100) NOT NULL,
  component_type ENUM('CIE', 'Assignment', 'Lab', 'Project', 'Viva', 'Other') DEFAULT 'CIE',
  max_marks DECIMAL(5,2) NOT NULL,
  weightage_percent DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
  UNIQUE (subject_id, component_name)
);

-- ===================================
-- STUDENT COMPONENT MARKS
-- ===================================
CREATE TABLE student_component_marks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usn VARCHAR(20) NOT NULL,
  component_id INT NOT NULL,
  marks_obtained DECIMAL(5,2) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usn) REFERENCES students(usn) ON DELETE CASCADE,
  FOREIGN KEY (component_id) REFERENCES exam_components(component_id) ON DELETE CASCADE,
  UNIQUE (usn, component_id)
);

-- ===================================
-- MARKS
-- ===================================
CREATE TABLE marks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usn VARCHAR(20) NOT NULL,
  subject_id INT NOT NULL,
  internal_total DECIMAL(5,2),
  academic_year VARCHAR(9) NOT NULL,
  semester TINYINT NOT NULL,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usn) REFERENCES students(usn) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
  UNIQUE (usn, subject_id, academic_year)
);

-- ===================================
-- DISPLAY PIC (removed duplicate definition)
-- ===================================
CREATE TABLE display_pic (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  UNIQUE (user_id, is_active)
);

-- ===================================
-- REPORT CARD VIEW
-- ===================================
CREATE VIEW report_card_view AS
SELECT
  s.usn,
  CONCAT(s.first_name, ' ', s.last_name) AS student_name,
  s.semester,
  sub.subject_code,
  sub.subject_name,
  m.internal_total,
  m.academic_year,
  m.calculated_at
FROM marks m
JOIN students s ON m.usn = s.usn
JOIN subjects sub ON m.subject_id = sub.subject_id;
