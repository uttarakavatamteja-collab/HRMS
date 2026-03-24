const db = require('../config/database');

exports.getLeaveTypes = async (req, res) => {
  const result = await db.query('SELECT * FROM leave_types ORDER BY name');
  res.json({ success: true, data: result.rows });
};

exports.getLeaveBalance = async (req, res) => {
  const employeeId = req.params.employeeId || req.user.employee_id;
  const year = req.query.year || new Date().getFullYear();
  const result = await db.query(
    `SELECT lb.*, lt.name as leave_type_name, lt.code, lt.is_paid
     FROM leave_balances lb
     JOIN leave_types lt ON lb.leave_type_id = lt.id
     WHERE lb.employee_id = $1 AND lb.year = $2`,
    [employeeId, year]
  );
  res.json({ success: true, data: result.rows });
};

exports.applyLeave = async (req, res) => {
  try {
    const { leaveTypeId, fromDate, toDate, reason } = req.body;
    const employeeId = req.user.employee_id;

    // Calculate working days
    const from = new Date(fromDate);
    const to = new Date(toDate);
    let totalDays = 0;
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) totalDays++;
    }

    // Check balance
    const year = from.getFullYear();
    const balance = await db.query(
      'SELECT * FROM leave_balances WHERE employee_id = $1 AND leave_type_id = $2 AND year = $3',
      [employeeId, leaveTypeId, year]
    );

    if (balance.rows.length > 0 && balance.rows[0].remaining_days < totalDays) {
      return res.status(400).json({ success: false, message: 'Insufficient leave balance' });
    }

    const result = await db.query(
      `INSERT INTO leave_applications (employee_id, leave_type_id, from_date, to_date, total_days, reason)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [employeeId, leaveTypeId, fromDate, toDate, totalDays, reason]
    );

    // Update pending days
    await db.query(
      'UPDATE leave_balances SET pending_days = pending_days + $1 WHERE employee_id = $2 AND leave_type_id = $3 AND year = $4',
      [totalDays, employeeId, leaveTypeId, year]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Leave applied successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getLeaveApplications = async (req, res) => {
  try {
    const { status, employeeId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT la.*, lt.name as leave_type_name, lt.code,
             e.first_name || ' ' || e.last_name as employee_name, e.employee_id as emp_code,
             d.name as department_name,
             a.first_name || ' ' || a.last_name as approved_by_name
      FROM leave_applications la
      JOIN leave_types lt ON la.leave_type_id = lt.id
      JOIN employees e ON la.employee_id = e.id
      JOIN departments d ON e.department_id = d.id
      LEFT JOIN employees a ON la.approved_by = a.id
      WHERE 1=1
    `;
    const params = [];

    if (status) { params.push(status); query += ` AND la.status = $${params.length}`; }
    if (employeeId) { params.push(employeeId); query += ` AND la.employee_id = $${params.length}`; }
    
    // Non-admins see only their own
    if (req.user.role === 'employee') {
      params.push(req.user.employee_id);
      query += ` AND la.employee_id = $${params.length}`;
    }

    params.push(limit); params.push(offset);
    query += ` ORDER BY la.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const approverId = req.user.employee_id;

    const leaveResult = await db.query('SELECT * FROM leave_applications WHERE id = $1', [req.params.id]);
    if (leaveResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
    const leave = leaveResult.rows[0];

    await db.query(
      'UPDATE leave_applications SET status=$1, approved_by=$2, approved_at=NOW(), remarks=$3 WHERE id=$4',
      [status, approverId, remarks, req.params.id]
    );

    const year = new Date(leave.from_date).getFullYear();
    if (status === 'approved') {
      await db.query(
        `UPDATE leave_balances SET used_days = used_days + $1, pending_days = pending_days - $1, remaining_days = remaining_days - $1
         WHERE employee_id = $2 AND leave_type_id = $3 AND year = $4`,
        [leave.total_days, leave.employee_id, leave.leave_type_id, year]
      );
    } else if (status === 'rejected') {
      await db.query(
        'UPDATE leave_balances SET pending_days = pending_days - $1 WHERE employee_id = $2 AND leave_type_id = $3 AND year = $4',
        [leave.total_days, leave.employee_id, leave.leave_type_id, year]
      );
    }

    res.json({ success: true, message: `Leave ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getHolidays = async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  const result = await db.query('SELECT * FROM holidays WHERE year = $1 ORDER BY date', [year]);
  res.json({ success: true, data: result.rows });
};
