const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Controllers
const authController = require('../controllers/authController');
const employeeController = require('../controllers/employeeController');
const leaveController = require('../controllers/leaveController');
const attendanceController = require('../controllers/attendanceController');
const payrollController = require('../controllers/payrollController');
const helpdeskController = require('../controllers/helpdeskController');
const recruitmentController = require('../controllers/recruitmentController');
const db = require('../config/database');

// ── AUTH ──────────────────────────────────────────
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticate, authController.getMe);
router.post('/auth/logout', authenticate, authController.logout);
router.put('/auth/change-password', authenticate, authController.changePassword);

// ── DASHBOARD ─────────────────────────────────────
router.get('/dashboard/stats', authenticate, employeeController.getDashboardStats);
router.get('/dashboard/announcements', authenticate, async (req, res) => {
  const result = await db.query('SELECT a.*, e.first_name || \' \' || e.last_name as posted_by_name FROM announcements a JOIN employees e ON a.posted_by = e.id WHERE a.is_active = true ORDER BY a.created_at DESC LIMIT 10');
  res.json({ success: true, data: result.rows });
});

// ── EMPLOYEES ─────────────────────────────────────
router.get('/employees', authenticate, employeeController.getAllEmployees);
router.post('/employees', authenticate, authorize('admin', 'hr'), employeeController.createEmployee);
router.get('/employees/:id', authenticate, employeeController.getEmployee);
router.put('/employees/:id', authenticate, authorize('admin', 'hr'), employeeController.updateEmployee);
router.delete('/employees/:id', authenticate, authorize('admin'), employeeController.deleteEmployee);

// ── DEPARTMENTS ───────────────────────────────────
router.get('/departments', authenticate, async (req, res) => {
  const result = await db.query('SELECT d.*, COUNT(e.id) as employee_count FROM departments d LEFT JOIN employees e ON d.id = e.department_id AND e.status=\'active\' GROUP BY d.id ORDER BY d.name');
  res.json({ success: true, data: result.rows });
});

router.post('/departments', authenticate, authorize('admin', 'hr'), async (req, res) => {
  const { name, code, description } = req.body;
  const result = await db.query('INSERT INTO departments (name, code, description) VALUES ($1,$2,$3) RETURNING *', [name, code, description]);
  res.status(201).json({ success: true, data: result.rows[0] });
});

// ── DESIGNATIONS ──────────────────────────────────
router.get('/designations', authenticate, async (req, res) => {
  const { departmentId } = req.query;
  let query = 'SELECT * FROM designations WHERE 1=1';
  const params = [];
  if (departmentId) { params.push(departmentId); query += ` AND department_id = $${params.length}`; }
  query += ' ORDER BY title';
  const result = await db.query(query, params);
  res.json({ success: true, data: result.rows });
});

// ── LEAVE ─────────────────────────────────────────
router.get('/leaves/types', authenticate, leaveController.getLeaveTypes);
router.get('/leaves/balance', authenticate, leaveController.getLeaveBalance);
router.get('/leaves/balance/:employeeId', authenticate, leaveController.getLeaveBalance);
router.post('/leaves/apply', authenticate, leaveController.applyLeave);
router.get('/leaves/applications', authenticate, leaveController.getLeaveApplications);
router.put('/leaves/applications/:id', authenticate, authorize('admin', 'hr', 'manager'), leaveController.updateLeaveStatus);
router.get('/leaves/holidays', authenticate, leaveController.getHolidays);

// ── ATTENDANCE ────────────────────────────────────
router.post('/attendance/mark', authenticate, attendanceController.markAttendance);
router.get('/attendance/today', authenticate, attendanceController.getTodayStatus);
router.get('/attendance', authenticate, attendanceController.getAttendance);
router.post('/attendance/regularize', authenticate, attendanceController.requestRegularization);

// ── PAYROLL ───────────────────────────────────────
router.post('/payroll/process', authenticate, authorize('admin', 'hr'), payrollController.processPayroll);
router.get('/payroll', authenticate, payrollController.getPayrolls);
router.get('/payroll/:id/payslip', authenticate, payrollController.getPayslip);

// ── HELPDESK ──────────────────────────────────────
router.post('/helpdesk/tickets', authenticate, helpdeskController.createTicket);
router.get('/helpdesk/tickets', authenticate, helpdeskController.getTickets);
router.put('/helpdesk/tickets/:id', authenticate, authorize('admin', 'hr'), helpdeskController.updateTicket);
router.post('/helpdesk/tickets/:id/comments', authenticate, helpdeskController.addComment);
router.get('/helpdesk/tickets/:id/comments', authenticate, helpdeskController.getTicketComments);

// ── RECRUITMENT ───────────────────────────────────
router.get('/recruitment/jobs', authenticate, recruitmentController.getJobPostings);
router.post('/recruitment/jobs', authenticate, authorize('admin', 'hr'), recruitmentController.createJobPosting);
router.get('/recruitment/candidates', authenticate, recruitmentController.getCandidates);
router.put('/recruitment/candidates/:id/stage', authenticate, recruitmentController.updateCandidateStage);

// ── PERFORMANCE ───────────────────────────────────
router.get('/performance/reviews', authenticate, async (req, res) => {
  const query = `SELECT pr.*, e.first_name || ' ' || e.last_name as employee_name, 
    r.first_name || ' ' || r.last_name as reviewer_name FROM performance_reviews pr
    JOIN employees e ON pr.employee_id = e.id JOIN employees r ON pr.reviewer_id = r.id ORDER BY pr.created_at DESC`;
  const result = await db.query(query);
  res.json({ success: true, data: result.rows });
});

// ── REPORTS ───────────────────────────────────────
router.get('/reports/headcount', authenticate, authorize('admin', 'hr'), async (req, res) => {
  const result = await db.query(
    `SELECT d.name as department, COUNT(e.id) as count, 
     COUNT(CASE WHEN e.gender='Male' THEN 1 END) as male,
     COUNT(CASE WHEN e.gender='Female' THEN 1 END) as female
     FROM departments d LEFT JOIN employees e ON d.id=e.department_id AND e.status='active'
     GROUP BY d.name ORDER BY count DESC`
  );
  res.json({ success: true, data: result.rows });
});

router.get('/reports/attendance-summary', authenticate, authorize('admin', 'hr'), async (req, res) => {
  const { month, year } = req.query;
  const m = month || new Date().getMonth() + 1;
  const y = year || new Date().getFullYear();
  const result = await db.query(
    `SELECT e.first_name || ' ' || e.last_name as name, e.employee_id as emp_code,
     COUNT(a.id) as total_days,
     COUNT(CASE WHEN a.status='present' THEN 1 END) as present,
     COUNT(CASE WHEN a.status='absent' THEN 1 END) as absent,
     COALESCE(AVG(a.working_hours), 0) as avg_hours
     FROM employees e LEFT JOIN attendance a ON e.id=a.employee_id
     AND EXTRACT(MONTH FROM a.date)=$1 AND EXTRACT(YEAR FROM a.date)=$2
     WHERE e.status='active' GROUP BY e.id, e.first_name, e.last_name, e.employee_id`,
    [m, y]
  );
  res.json({ success: true, data: result.rows });
});

module.exports = router;
