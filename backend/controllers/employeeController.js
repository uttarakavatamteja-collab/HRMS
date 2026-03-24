const db = require('../config/database');

exports.getAllEmployees = async (req, res) => {
  try {
    const { department, status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT e.*, d.name as department_name, des.title as designation_title,
             m.first_name || ' ' || m.last_name as manager_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations des ON e.designation_id = des.id
      LEFT JOIN employees m ON e.manager_id = m.id
      WHERE 1=1
    `;
    const params = [];

    if (department) { params.push(department); query += ` AND e.department_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND e.status = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (e.first_name ILIKE $${params.length} OR e.last_name ILIKE $${params.length} OR e.email ILIKE $${params.length} OR e.employee_id ILIKE $${params.length})`;
    }

    const countResult = await db.query(`SELECT COUNT(*) FROM (${query}) t`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit); params.push(offset);
    query += ` ORDER BY e.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getEmployee = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT e.*, d.name as department_name, des.title as designation_title,
       m.first_name || ' ' || m.last_name as manager_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN designations des ON e.designation_id = des.id
       LEFT JOIN employees m ON e.manager_id = m.id
       WHERE e.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Employee not found' });
    
    const salaryResult = await db.query(
      'SELECT * FROM salary_structures WHERE employee_id = $1 AND effective_to IS NULL ORDER BY effective_from DESC LIMIT 1',
      [req.params.id]
    );

    res.json({ success: true, data: { ...result.rows[0], salary: salaryResult.rows[0] || null } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, dateOfBirth, gender, bloodGroup, address, city, state, pincode,
      departmentId, designationId, managerId, dateOfJoining, employmentType, panNumber, aadharNumber,
      bankAccountNumber, bankIfsc, bankName, emergencyContactName, emergencyContactPhone,
      basicSalary, hra, da, ta, medicalAllowance, specialAllowance
    } = req.body;

    // Generate employee ID
    const empCountResult = await db.query('SELECT COUNT(*) FROM employees');
    const empNum = parseInt(empCountResult.rows[0].count) + 1;
    const employeeId = `EMP${String(empNum).padStart(3, '0')}`;

    const empResult = await db.query(
      `INSERT INTO employees (employee_id, first_name, last_name, email, phone, date_of_birth, gender, blood_group,
       address, city, state, pincode, department_id, designation_id, manager_id, date_of_joining, employment_type,
       pan_number, aadhar_number, bank_account_number, bank_ifsc, bank_name, emergency_contact_name, emergency_contact_phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
       RETURNING *`,
      [employeeId, firstName, lastName, email, phone, dateOfBirth, gender, bloodGroup, address, city, state, pincode,
       departmentId, designationId, managerId, dateOfJoining, employmentType || 'full_time',
       panNumber, aadharNumber, bankAccountNumber, bankIfsc, bankName, emergencyContactName, emergencyContactPhone]
    );

    const newEmployee = empResult.rows[0];

    // Create user account
    const bcrypt = require('bcryptjs');
    const defaultPassword = await bcrypt.hash('emp123', 10);
    await db.query(
      'INSERT INTO users (employee_id, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      [newEmployee.id, email, defaultPassword, 'employee']
    );

    // Create salary structure
    if (basicSalary) {
      await db.query(
        `INSERT INTO salary_structures (employee_id, basic_salary, hra, da, ta, medical_allowance, special_allowance, pf_employee, pf_employer, professional_tax, effective_from)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [newEmployee.id, basicSalary, hra || 0, da || 0, ta || 0, medicalAllowance || 0, specialAllowance || 0,
         basicSalary * 0.12, basicSalary * 0.12, 200, dateOfJoining]
      );
    }

    // Create leave balances for current year
    const year = new Date().getFullYear();
    const leaveTypes = await db.query("SELECT * FROM leave_types WHERE code NOT IN ('CO', 'LOP')");
    for (const lt of leaveTypes.rows) {
      await db.query(
        'INSERT INTO leave_balances (employee_id, leave_type_id, year, total_days, remaining_days) VALUES ($1,$2,$3,$4,$4)',
        [newEmployee.id, lt.id, year, lt.days_allowed]
      );
    }

    res.status(201).json({ success: true, data: newEmployee, message: 'Employee created successfully' });
  } catch (error) {
    console.error(error);
    if (error.code === '23505') return res.status(400).json({ success: false, message: 'Email already exists' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { firstName, lastName, phone, dateOfBirth, gender, bloodGroup, address, city, state, pincode,
      departmentId, designationId, managerId, employmentType, status, panNumber, aadharNumber,
      bankAccountNumber, bankIfsc, bankName, emergencyContactName, emergencyContactPhone } = req.body;

    const result = await db.query(
      `UPDATE employees SET first_name=$1, last_name=$2, phone=$3, date_of_birth=$4, gender=$5, blood_group=$6,
       address=$7, city=$8, state=$9, pincode=$10, department_id=$11, designation_id=$12, manager_id=$13,
       employment_type=$14, status=$15, pan_number=$16, aadhar_number=$17, bank_account_number=$18,
       bank_ifsc=$19, bank_name=$20, emergency_contact_name=$21, emergency_contact_phone=$22
       WHERE id=$23 RETURNING *`,
      [firstName, lastName, phone, dateOfBirth, gender, bloodGroup, address, city, state, pincode,
       departmentId, designationId, managerId, employmentType, status, panNumber, aadharNumber,
       bankAccountNumber, bankIfsc, bankName, emergencyContactName, emergencyContactPhone, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    await db.query("UPDATE employees SET status = 'inactive' WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: 'Employee deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const [total, active, newThisMonth, departments] = await Promise.all([
      db.query('SELECT COUNT(*) FROM employees'),
      db.query("SELECT COUNT(*) FROM employees WHERE status = 'active'"),
      db.query("SELECT COUNT(*) FROM employees WHERE date_trunc('month', date_of_joining) = date_trunc('month', NOW())"),
      db.query('SELECT COUNT(*) FROM departments'),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const [presentToday, pendingLeaves, openTickets] = await Promise.all([
      db.query("SELECT COUNT(*) FROM attendance WHERE date = $1 AND status = 'present'", [today]),
      db.query("SELECT COUNT(*) FROM leave_applications WHERE status = 'pending'"),
      db.query("SELECT COUNT(*) FROM helpdesk_tickets WHERE status IN ('open', 'in_progress')"),
    ]);

    res.json({
      success: true,
      data: {
        totalEmployees: parseInt(total.rows[0].count),
        activeEmployees: parseInt(active.rows[0].count),
        newThisMonth: parseInt(newThisMonth.rows[0].count),
        departments: parseInt(departments.rows[0].count),
        presentToday: parseInt(presentToday.rows[0].count),
        pendingLeaves: parseInt(pendingLeaves.rows[0].count),
        openTickets: parseInt(openTickets.rows[0].count),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
