const db = require('../config/database');

exports.processPayroll = async (req, res) => {
  try {
    const { month, year, employeeIds } = req.body;

    let empQuery = 'SELECT e.*, ss.* FROM employees e JOIN salary_structures ss ON e.id = ss.employee_id WHERE e.status = $1 AND ss.effective_to IS NULL';
    const params = ['active'];

    if (employeeIds && employeeIds.length > 0) {
      empQuery += ` AND e.id = ANY($2)`;
      params.push(employeeIds);
    }

    const employees = await db.query(empQuery, params);
    const results = [];

    for (const emp of employees.rows) {
      // Get attendance for the month
      const attResult = await db.query(
        `SELECT 
          COUNT(*) FILTER (WHERE status = 'present') as present,
          COUNT(*) FILTER (WHERE status = 'half_day') as half_day,
          COUNT(*) FILTER (WHERE status = 'absent') as absent
         FROM attendance
         WHERE employee_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3`,
        [emp.id, month, year]
      );

      const att = attResult.rows[0];
      const workingDays = 26; // standard
      const presentDays = parseInt(att.present) + parseInt(att.half_day) * 0.5;
      const lopDays = Math.max(0, workingDays - presentDays);

      const grossSalary = parseFloat(emp.basic_salary) + parseFloat(emp.hra) + parseFloat(emp.da) +
        parseFloat(emp.ta) + parseFloat(emp.medical_allowance) + parseFloat(emp.special_allowance);
      
      const perDaySalary = grossSalary / workingDays;
      const lopDeduction = lopDays * perDaySalary;
      const totalDeductions = parseFloat(emp.pf_employee) + parseFloat(emp.esi_employee || 0) +
        parseFloat(emp.professional_tax) + parseFloat(emp.tds || 0) + lopDeduction;
      const netSalary = grossSalary - totalDeductions;

      // Upsert payroll
      await db.query(
        `INSERT INTO payrolls (employee_id, month, year, working_days, present_days, loss_of_pay_days, gross_salary, total_deductions, net_salary, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'processed')
         ON CONFLICT (employee_id, month, year) DO UPDATE SET
         working_days=$4, present_days=$5, loss_of_pay_days=$6, gross_salary=$7, total_deductions=$8, net_salary=$9, status='processed'`,
        [emp.id, month, year, workingDays, presentDays, lopDays, grossSalary.toFixed(2), totalDeductions.toFixed(2), netSalary.toFixed(2)]
      );

      results.push({ employeeId: emp.id, empCode: emp.employee_id, netSalary: netSalary.toFixed(2) });
    }

    res.json({ success: true, data: results, message: `Payroll processed for ${results.length} employees` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getPayrolls = async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;
    const m = month || new Date().getMonth() + 1;
    const y = year || new Date().getFullYear();

    let query = `
      SELECT p.*, e.first_name || ' ' || e.last_name as employee_name, e.employee_id as emp_code,
             d.name as department_name, ss.basic_salary, ss.hra, ss.da, ss.ta, ss.medical_allowance,
             ss.special_allowance, ss.pf_employee, ss.pf_employer, ss.professional_tax
      FROM payrolls p
      JOIN employees e ON p.employee_id = e.id
      JOIN departments d ON e.department_id = d.id
      LEFT JOIN salary_structures ss ON e.id = ss.employee_id AND ss.effective_to IS NULL
      WHERE p.month = $1 AND p.year = $2
    `;
    const params = [m, y];

    if (employeeId) { params.push(employeeId); query += ` AND p.employee_id = $${params.length}`; }
    if (req.user.role === 'employee') { params.push(req.user.employee_id); query += ` AND p.employee_id = $${params.length}`; }

    query += ' ORDER BY e.first_name';
    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getPayslip = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, e.*, d.name as department_name, des.title as designation_title,
              ss.basic_salary, ss.hra, ss.da, ss.ta, ss.medical_allowance, ss.special_allowance,
              ss.pf_employee, ss.pf_employer, ss.esi_employee, ss.professional_tax, ss.tds
       FROM payrolls p
       JOIN employees e ON p.employee_id = e.id
       JOIN departments d ON e.department_id = d.id
       JOIN designations des ON e.designation_id = des.id
       LEFT JOIN salary_structures ss ON e.id = ss.employee_id AND ss.effective_to IS NULL
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Payroll not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
