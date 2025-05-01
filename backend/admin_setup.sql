-- Use the college ERP database
USE college_erp;

-- Insert a default department (required for admin user)
INSERT INTO departments (department_code, department_name, created_at, updated_at)
VALUES ('ADMIN', 'Administration', NOW(), NOW());

-- Get the department ID we just created
SET @dept_id = LAST_INSERT_ID();

-- Insert the admin user
INSERT INTO users (
    username, 
    password_hash,
    role,
    is_active,
    last_login
)
VALUES (
    'admin', 
    '$2a$10$S2OGZRmwpUBNzo22dhq5d.k3ohipzRG2XzcP.6oWLuoI4BFanKHSC', -- Hash for 'admin123'
    1, -- 1=SuperAdmin
    true,
    NULL
);

-- Display the inserted user
SELECT * FROM users WHERE username = 'admin'; 