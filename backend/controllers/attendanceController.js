const db = require('../config/database');

exports.markAttendance = async (req, res) => {
  try {
    const { type } = req.body; // check_in or check_out
    const employeeId = req.user.employee_id;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    if (type === 'check_in') {
      const existing = await db.query('SELECT * FROM attendance WHERE employee_id=$1 AND date=$2', [employeeId, today]);
      if (existing.rows.length > 0) return res.status(400).json({ success: false, message: 'Already checked in' });
      
      await db.query(
        "INSERT INTO attendance (employee_id, date, check_in, status) VALUES ($1,$2,$3,'present')",
        [employeeId, today, now]
      );
    } else {
      const record = await db.query('SELECT * FROM attendance WHERE employee_id=$1 AND date=$2', [employeeId, today]);
      if (record.rows.length === 0) return res.status(400).json({ success: false, message: 'No check-in found' });
      
      const checkIn = new Date(record.rows[0].check_in);
      const hours = (now - checkIn) / (1000 * 60 * 60);
      
      await db.query(
        'UPDATE attendance SET check_out=$1, working_hours=$2 WHERE employee_id=$3 AND date=$4',
        [now, hours.toFixed(2), employeeId, today]
      );
    }

    res.json({ success: true, message: `${type === 'check_in' ? 'Checked in' : 'Checked out'} successfully`, time: now });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const { employeeId, month, year, page = 1, limit = 31 } = req.query;
    const offset = (page - 1) * limit;
    
    let empId = employeeId;
    if (req.user.role === 'employee') empId = req.user.employee_id;

    const m = month || (new Date().getMonth() + 1);
    const y = year || new Date().getFullYear();

    let query = `
      SELECT a.*, e.first_name || ' ' || e.last_name as employee_name, e.employee_id as emp_code
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE EXTRACT(MONTH FROM a.date) = $1 AND EXTRACT(YEAR FROM a.date) = $2
    `;
    const params = [m, y];

    if (empId) { params.push(empId); query += ` AND a.employee_id = $${params.length}`; }
    query += ` ORDER BY a.date DESC LIMIT ${limit} OFFSET ${offset}`;

    const result = await db.query(query, params);

    // Summary
    if (empId) {
      const summary = await db.query(
        `SELECT 
          COUNT(*) FILTER (WHERE status = 'present') as present,
          COUNT(*) FILTER (WHERE status = 'absent') as absent,
          COUNT(*) FILTER (WHERE status = 'half_day') as half_day,
          COUNT(*) FILTER (WHERE status = 'late') as late,
          COALESCE(SUM(working_hours), 0) as total_hours
         FROM attendance
         WHERE employee_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3`,
        [empId, m, y]
      );
      return res.json({ success: true, data: result.rows, summary: summary.rows[0] });
    }

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getTodayStatus = async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const employeeId = req.user.employee_id;
  const result = await db.query('SELECT * FROM attendance WHERE employee_id=$1 AND date=$2', [employeeId, today]);
  res.json({ success: true, data: result.rows[0] || null });
};

exports.requestRegularization = async (req, res) => {
  try {
    const { date, checkIn, checkOut, reason } = req.body;
    const employeeId = req.user.employee_id;
    
    await db.query(
      'UPDATE attendance SET regularization_requested=true, regularization_status=$1, remarks=$2 WHERE employee_id=$3 AND date=$4',
      ['pending', reason, employeeId, date]
    );

    res.json({ success: true, message: 'Regularization request submitted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
