-- HRMS Seed Data
-- Run after schema.sql: psql -U postgres -d hrms_db -f seed.sql

-- Departments
INSERT INTO departments (id, name, code, description) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Human Resources', 'HR', 'Managing people and culture'),
  ('11111111-1111-1111-1111-111111111102', 'Engineering', 'ENG', 'Software development and IT'),
  ('11111111-1111-1111-1111-111111111103', 'Finance', 'FIN', 'Financial operations'),
  ('11111111-1111-1111-1111-111111111104', 'Sales', 'SAL', 'Revenue generation'),
  ('11111111-1111-1111-1111-111111111105', 'Marketing', 'MKT', 'Brand and growth');

-- Designations
INSERT INTO designations (id, title, department_id, level) VALUES
  ('22222222-2222-2222-2222-222222222201', 'HR Manager', '11111111-1111-1111-1111-111111111101', 3),
  ('22222222-2222-2222-2222-222222222202', 'HR Executive', '11111111-1111-1111-1111-111111111101', 2),
  ('22222222-2222-2222-2222-222222222203', 'Software Engineer', '11111111-1111-1111-1111-111111111102', 2),
  ('22222222-2222-2222-2222-222222222204', 'Senior Software Engineer', '11111111-1111-1111-1111-111111111102', 3),
  ('22222222-2222-2222-2222-222222222205', 'Tech Lead', '11111111-1111-1111-1111-111111111102', 4),
  ('22222222-2222-2222-2222-222222222206', 'Finance Manager', '11111111-1111-1111-1111-111111111103', 3),
  ('22222222-2222-2222-2222-222222222207', 'Sales Executive', '11111111-1111-1111-1111-111111111104', 2),
  ('22222222-2222-2222-2222-222222222208', 'Marketing Manager', '11111111-1111-1111-1111-111111111105', 3);

-- Employees
INSERT INTO employees (id, employee_id, first_name, last_name, email, phone, date_of_birth, gender, department_id, designation_id, date_of_joining, employment_type, status) VALUES
  ('33333333-3333-3333-3333-333333333301', 'EMP001', 'Admin', 'User', 'admin@company.com', '9876543210', '1985-03-15', 'Male', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', '2020-01-01', 'full_time', 'active'),
  ('33333333-3333-3333-3333-333333333302', 'EMP002', 'Priya', 'Sharma', 'priya.sharma@company.com', '9876543211', '1992-07-22', 'Female', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222202', '2021-03-15', 'full_time', 'active'),
  ('33333333-3333-3333-3333-333333333303', 'EMP003', 'Rahul', 'Verma', 'rahul.verma@company.com', '9876543212', '1995-11-10', 'Male', '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222203', '2022-06-01', 'full_time', 'active'),
  ('33333333-3333-3333-3333-333333333304', 'EMP004', 'Sneha', 'Patel', 'sneha.patel@company.com', '9876543213', '1990-04-18', 'Female', '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222204', '2020-09-01', 'full_time', 'active'),
  ('33333333-3333-3333-3333-333333333305', 'EMP005', 'Arjun', 'Kumar', 'arjun.kumar@company.com', '9876543214', '1988-12-05', 'Male', '11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222206', '2019-04-01', 'full_time', 'active'),
  ('33333333-3333-3333-3333-333333333306', 'EMP006', 'Divya', 'Nair', 'divya.nair@company.com', '9876543215', '1993-08-30', 'Female', '11111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222207', '2022-01-15', 'full_time', 'active'),
  ('33333333-3333-3333-3333-333333333307', 'EMP007', 'Kiran', 'Reddy', 'kiran.reddy@company.com', '9876543216', '1991-02-14', 'Male', '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222205', '2019-11-01', 'full_time', 'active');

-- Users
INSERT INTO users (employee_id, email, password_hash, role) VALUES
  ('33333333-3333-3333-3333-333333333301', 'admin@company.com', '$2b$10$rQ.4v6lRjPV4V4K1gqN0iuVxKFqG4VFi3NqY5Y5Y5Y5Y5Y5Y5Y5Y5', 'admin'),
  ('33333333-3333-3333-3333-333333333302', 'priya.sharma@company.com', '$2b$10$rQ.4v6lRjPV4V4K1gqN0iuVxKFqG4VFi3NqY5Y5Y5Y5Y5Y5Y5Y5Y5', 'hr'),
  ('33333333-3333-3333-3333-333333333303', 'rahul.verma@company.com', '$2b$10$rQ.4v6lRjPV4V4K1gqN0iuVxKFqG4VFi3NqY5Y5Y5Y5Y5Y5Y5Y5Y5', 'employee'),
  ('33333333-3333-3333-3333-333333333304', 'sneha.patel@company.com', '$2b$10$rQ.4v6lRjPV4V4K1gqN0iuVxKFqG4VFi3NqY5Y5Y5Y5Y5Y5Y5Y5Y5', 'manager'),
  ('33333333-3333-3333-3333-333333333305', 'arjun.kumar@company.com', '$2b$10$rQ.4v6lRjPV4V4K1gqN0iuVxKFqG4VFi3NqY5Y5Y5Y5Y5Y5Y5Y5Y5', 'employee');

-- Salary Structures
INSERT INTO salary_structures (employee_id, basic_salary, hra, da, ta, medical_allowance, special_allowance, pf_employee, pf_employer, professional_tax, effective_from) VALUES
  ('33333333-3333-3333-3333-333333333301', 60000, 24000, 6000, 3000, 1250, 10000, 7200, 7200, 200, '2024-01-01'),
  ('33333333-3333-3333-3333-333333333302', 45000, 18000, 4500, 2000, 1250, 5000, 5400, 5400, 200, '2024-01-01'),
  ('33333333-3333-3333-3333-333333333303', 50000, 20000, 5000, 2000, 1250, 7500, 6000, 6000, 200, '2024-01-01'),
  ('33333333-3333-3333-3333-333333333304', 70000, 28000, 7000, 3000, 1250, 12000, 8400, 8400, 200, '2024-01-01'),
  ('33333333-3333-3333-3333-333333333305', 65000, 26000, 6500, 3000, 1250, 10000, 7800, 7800, 200, '2024-01-01');

-- Leave Types
INSERT INTO leave_types (id, name, code, days_allowed, carry_forward, is_paid) VALUES
  ('44444444-4444-4444-4444-444444444401', 'Casual Leave', 'CL', 12, false, true),
  ('44444444-4444-4444-4444-444444444402', 'Sick Leave', 'SL', 12, false, true),
  ('44444444-4444-4444-4444-444444444403', 'Earned Leave', 'EL', 21, true, true),
  ('44444444-4444-4444-4444-444444444404', 'Maternity Leave', 'ML', 180, false, true),
  ('44444444-4444-4444-4444-444444444405', 'Paternity Leave', 'PL', 5, false, true),
  ('44444444-4444-4444-4444-444444444406', 'Compensatory Off', 'CO', 0, false, true),
  ('44444444-4444-4444-4444-444444444407', 'Loss of Pay', 'LOP', 0, false, false);

-- Leave Balances (2025)
INSERT INTO leave_balances (employee_id, leave_type_id, year, total_days, used_days, pending_days, remaining_days) VALUES
  ('33333333-3333-3333-3333-333333333303', '44444444-4444-4444-4444-444444444401', 2025, 12, 3, 0, 9),
  ('33333333-3333-3333-3333-333333333303', '44444444-4444-4444-4444-444444444402', 2025, 12, 1, 0, 11),
  ('33333333-3333-3333-3333-333333333303', '44444444-4444-4444-4444-444444444403', 2025, 21, 5, 0, 16),
  ('33333333-3333-3333-3333-333333333304', '44444444-4444-4444-4444-444444444401', 2025, 12, 2, 1, 9),
  ('33333333-3333-3333-3333-333333333304', '44444444-4444-4444-4444-444444444402', 2025, 12, 0, 0, 12),
  ('33333333-3333-3333-3333-333333333304', '44444444-4444-4444-4444-444444444403', 2025, 21, 7, 0, 14);

-- Leave Applications
INSERT INTO leave_applications (employee_id, leave_type_id, from_date, to_date, total_days, reason, status, approved_by) VALUES
  ('33333333-3333-3333-3333-333333333303', '44444444-4444-4444-4444-444444444401', '2025-02-10', '2025-02-12', 3, 'Personal work', 'approved', '33333333-3333-3333-3333-333333333302'),
  ('33333333-3333-3333-3333-333333333303', '44444444-4444-4444-4444-444444444402', '2025-03-05', '2025-03-05', 1, 'Not feeling well', 'approved', '33333333-3333-3333-3333-333333333302'),
  ('33333333-3333-3333-3333-333333333304', '44444444-4444-4444-4444-444444444401', '2025-03-20', '2025-03-21', 2, 'Family function', 'approved', '33333333-3333-3333-3333-333333333301'),
  ('33333333-3333-3333-3333-333333333304', '44444444-4444-4444-4444-444444444401', '2025-04-10', '2025-04-10', 1, 'Personal errand', 'pending', NULL);

-- Holidays 2025
INSERT INTO holidays (name, date, type, year) VALUES
  ('New Year', '2025-01-01', 'national', 2025),
  ('Republic Day', '2025-01-26', 'national', 2025),
  ('Holi', '2025-03-14', 'national', 2025),
  ('Good Friday', '2025-04-18', 'national', 2025),
  ('Eid ul-Fitr', '2025-04-30', 'national', 2025),
  ('Independence Day', '2025-08-15', 'national', 2025),
  ('Gandhi Jayanti', '2025-10-02', 'national', 2025),
  ('Diwali', '2025-10-20', 'national', 2025),
  ('Christmas', '2025-12-25', 'national', 2025);

-- Announcements
INSERT INTO announcements (title, content, type, posted_by) VALUES
  ('Annual Performance Review - Q1 2025', 'Dear team, annual performance reviews will begin from April 1st. Please complete your self-assessments by March 28th.', 'general', '33333333-3333-3333-3333-333333333301'),
  ('Office Closure - Holi', 'The office will remain closed on March 14th for Holi. Happy Holi to everyone!', 'general', '33333333-3333-3333-3333-333333333301'),
  ('New Leave Policy Update', 'Please review the updated leave policy effective April 1st 2025. Key changes include carry-forward rules.', 'policy', '33333333-3333-3333-3333-333333333302');

-- Helpdesk Tickets
INSERT INTO helpdesk_tickets (ticket_number, employee_id, category, subject, description, priority, status, assigned_to) VALUES
  ('TKT-2025-001', '33333333-3333-3333-3333-333333333303', 'payroll', 'February payslip not generated', 'My February 2025 payslip is not visible in the system.', 'high', 'in_progress', '33333333-3333-3333-3333-333333333302'),
  ('TKT-2025-002', '33333333-3333-3333-3333-333333333304', 'leave', 'Leave balance discrepancy', 'My earned leave balance shows 14 days but it should be 16 days.', 'medium', 'open', '33333333-3333-3333-3333-333333333302'),
  ('TKT-2025-003', '33333333-3333-3333-3333-333333333306', 'it_support', 'VPN access required', 'I need VPN access for work from home.', 'low', 'resolved', '33333333-3333-3333-3333-333333333301');

-- Job Postings
INSERT INTO job_postings (title, department_id, description, requirements, experience_min, experience_max, salary_min, salary_max, location, employment_type, openings, status, posted_by, closing_date) VALUES
  ('Senior React Developer', '11111111-1111-1111-1111-111111111102', 'We are looking for a Senior React Developer to join our engineering team.', 'React, TypeScript, Node.js, 4+ years', 4, 8, 800000, 1500000, 'Bangalore', 'full_time', 2, 'active', '33333333-3333-3333-3333-333333333302', '2025-05-31'),
  ('HR Business Partner', '11111111-1111-1111-1111-111111111101', 'HRBP role to drive HR strategy across departments.', 'HR degree, HRBP experience, 3+ years', 3, 6, 500000, 900000, 'Bangalore', 'full_time', 1, 'active', '33333333-3333-3333-3333-333333333301', '2025-04-30');

-- Candidates
INSERT INTO candidates (job_posting_id, first_name, last_name, email, phone, experience_years, current_company, expected_salary, stage) 
SELECT id, 'Ankit', 'Gupta', 'ankit.gupta@gmail.com', '9876500001', 5, 'TechCorp', 1200000, 'interview'
FROM job_postings WHERE title = 'Senior React Developer' LIMIT 1;

INSERT INTO candidates (job_posting_id, first_name, last_name, email, phone, experience_years, current_company, expected_salary, stage) 
SELECT id, 'Meena', 'Krishnan', 'meena.k@gmail.com', '9876500002', 4, 'InfoSystems', 1000000, 'screening'
FROM job_postings WHERE title = 'Senior React Developer' LIMIT 1;
