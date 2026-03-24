-- HRMS Database Schema
-- Run: psql -U postgres -c "CREATE DATABASE hrms_db;" then psql -U postgres -d hrms_db -f schema.sql

CREATE DATABASE IF NOT EXISTS hrms_db;
\c hrms_db;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  head_employee_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- DESIGNATIONS
-- ============================================================
CREATE TABLE designations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(100) NOT NULL,
  department_id UUID REFERENCES departments(id),
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- EMPLOYEES
-- ============================================================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(10),
  blood_group VARCHAR(5),
  address TEXT,
  city VARCHAR(50),
  state VARCHAR(50),
  pincode VARCHAR(10),
  department_id UUID REFERENCES departments(id),
  designation_id UUID REFERENCES designations(id),
  manager_id UUID REFERENCES employees(id),
  date_of_joining DATE NOT NULL,
  date_of_leaving DATE,
  employment_type VARCHAR(20) DEFAULT 'full_time', -- full_time, part_time, contract
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, terminated
  profile_picture VARCHAR(500),
  pan_number VARCHAR(20),
  aadhar_number VARCHAR(20),
  bank_account_number VARCHAR(30),
  bank_ifsc VARCHAR(20),
  bank_name VARCHAR(100),
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- USERS (Auth)
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'employee', -- admin, hr, manager, employee
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  refresh_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- SALARY STRUCTURE
-- ============================================================
CREATE TABLE salary_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  basic_salary DECIMAL(12,2) NOT NULL,
  hra DECIMAL(12,2) DEFAULT 0,
  da DECIMAL(12,2) DEFAULT 0,
  ta DECIMAL(12,2) DEFAULT 0,
  medical_allowance DECIMAL(12,2) DEFAULT 0,
  special_allowance DECIMAL(12,2) DEFAULT 0,
  pf_employee DECIMAL(12,2) DEFAULT 0,
  pf_employer DECIMAL(12,2) DEFAULT 0,
  esi_employee DECIMAL(12,2) DEFAULT 0,
  esi_employer DECIMAL(12,2) DEFAULT 0,
  professional_tax DECIMAL(12,2) DEFAULT 0,
  tds DECIMAL(12,2) DEFAULT 0,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PAYROLL
-- ============================================================
CREATE TABLE payrolls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  working_days INTEGER,
  present_days INTEGER,
  leave_days INTEGER,
  loss_of_pay_days INTEGER DEFAULT 0,
  gross_salary DECIMAL(12,2),
  total_deductions DECIMAL(12,2),
  net_salary DECIMAL(12,2),
  status VARCHAR(20) DEFAULT 'draft', -- draft, processed, paid
  payment_date DATE,
  payment_mode VARCHAR(20),
  payslip_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, month, year)
);

-- ============================================================
-- LEAVE TYPES
-- ============================================================
CREATE TABLE leave_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL,
  days_allowed INTEGER NOT NULL,
  carry_forward BOOLEAN DEFAULT false,
  max_carry_forward INTEGER DEFAULT 0,
  is_paid BOOLEAN DEFAULT true,
  applicable_gender VARCHAR(10) DEFAULT 'all',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- LEAVE BALANCE
-- ============================================================
CREATE TABLE leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  leave_type_id UUID REFERENCES leave_types(id),
  year INTEGER NOT NULL,
  total_days DECIMAL(5,1) DEFAULT 0,
  used_days DECIMAL(5,1) DEFAULT 0,
  pending_days DECIMAL(5,1) DEFAULT 0,
  remaining_days DECIMAL(5,1) DEFAULT 0,
  UNIQUE(employee_id, leave_type_id, year)
);

-- ============================================================
-- LEAVE APPLICATIONS
-- ============================================================
CREATE TABLE leave_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  leave_type_id UUID REFERENCES leave_types(id),
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  total_days DECIMAL(5,1) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMP,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ATTENDANCE
-- ============================================================
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  date DATE NOT NULL,
  check_in TIMESTAMP,
  check_out TIMESTAMP,
  working_hours DECIMAL(5,2),
  status VARCHAR(20) DEFAULT 'present', -- present, absent, half_day, late, on_leave, holiday, weekend
  source VARCHAR(20) DEFAULT 'manual', -- manual, biometric, mobile
  remarks TEXT,
  regularization_requested BOOLEAN DEFAULT false,
  regularization_status VARCHAR(20),
  UNIQUE(employee_id, date)
);

-- ============================================================
-- HOLIDAYS
-- ============================================================
CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(20) DEFAULT 'national', -- national, optional, restricted
  applicable_to VARCHAR(20) DEFAULT 'all',
  year INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- RECRUITMENT - JOB POSTINGS
-- ============================================================
CREATE TABLE job_postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(100) NOT NULL,
  department_id UUID REFERENCES departments(id),
  designation_id UUID REFERENCES designations(id),
  description TEXT,
  requirements TEXT,
  experience_min INTEGER DEFAULT 0,
  experience_max INTEGER DEFAULT 10,
  salary_min DECIMAL(12,2),
  salary_max DECIMAL(12,2),
  location VARCHAR(100),
  employment_type VARCHAR(20),
  openings INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active', -- active, closed, on_hold
  posted_by UUID REFERENCES employees(id),
  closing_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- CANDIDATES
-- ============================================================
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_posting_id UUID REFERENCES job_postings(id),
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  resume_url VARCHAR(500),
  experience_years INTEGER,
  current_company VARCHAR(100),
  current_salary DECIMAL(12,2),
  expected_salary DECIMAL(12,2),
  notice_period INTEGER, -- in days
  stage VARCHAR(30) DEFAULT 'applied', -- applied, screening, interview, offer, hired, rejected
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INTERVIEWS
-- ============================================================
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id),
  interviewer_id UUID REFERENCES employees(id),
  interview_type VARCHAR(30), -- phone, video, face_to_face, technical
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  feedback TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  result VARCHAR(20), -- pass, fail, on_hold
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PERFORMANCE REVIEWS
-- ============================================================
CREATE TABLE performance_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  reviewer_id UUID REFERENCES employees(id),
  review_period_from DATE,
  review_period_to DATE,
  review_type VARCHAR(20) DEFAULT 'annual', -- annual, quarterly, probation
  overall_rating DECIMAL(3,2),
  status VARCHAR(20) DEFAULT 'draft', -- draft, submitted, acknowledged
  employee_comments TEXT,
  reviewer_comments TEXT,
  goals_achieved INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- GOALS / KPIs
-- ============================================================
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  review_id UUID REFERENCES performance_reviews(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  target VARCHAR(200),
  achievement VARCHAR(200),
  weight INTEGER DEFAULT 10, -- percentage
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  status VARCHAR(20) DEFAULT 'active',
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- HELPDESK TICKETS
-- ============================================================
CREATE TABLE helpdesk_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  employee_id UUID REFERENCES employees(id),
  category VARCHAR(50) NOT NULL, -- payroll, leave, it_support, hr_policy, general
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  status VARCHAR(20) DEFAULT 'open', -- open, in_progress, resolved, closed
  assigned_to UUID REFERENCES employees(id),
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TICKET COMMENTS
-- ============================================================
CREATE TABLE ticket_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES helpdesk_tickets(id),
  author_id UUID REFERENCES employees(id),
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE employee_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  document_type VARCHAR(50) NOT NULL, -- offer_letter, experience_letter, payslip, id_proof, etc
  document_name VARCHAR(200) NOT NULL,
  file_url VARCHAR(500),
  uploaded_by UUID REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'general', -- general, urgent, policy
  audience VARCHAR(20) DEFAULT 'all', -- all, department, team
  department_id UUID REFERENCES departments(id),
  posted_by UUID REFERENCES employees(id),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX idx_leave_applications_employee ON leave_applications(employee_id);
CREATE INDEX idx_leave_applications_status ON leave_applications(status);
CREATE INDEX idx_payrolls_month_year ON payrolls(month, year);
CREATE INDEX idx_helpdesk_status ON helpdesk_tickets(status);
CREATE INDEX idx_candidates_stage ON candidates(stage);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_leave_applications_updated_at BEFORE UPDATE ON leave_applications FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_payrolls_updated_at BEFORE UPDATE ON payrolls FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_helpdesk_tickets_updated_at BEFORE UPDATE ON helpdesk_tickets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
