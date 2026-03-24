const db = require('../config/database');

const generateTicketNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `TKT-${year}-${random}`;
};

exports.createTicket = async (req, res) => {
  try {
    const { category, subject, description, priority } = req.body;
    const employeeId = req.user.employee_id;
    const ticketNumber = generateTicketNumber();

    const result = await db.query(
      `INSERT INTO helpdesk_tickets (ticket_number, employee_id, category, subject, description, priority)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [ticketNumber, employeeId, category, subject, description, priority || 'medium']
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getTickets = async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT ht.*, e.first_name || ' ' || e.last_name as employee_name, e.employee_id as emp_code,
             a.first_name || ' ' || a.last_name as assigned_to_name
      FROM helpdesk_tickets ht
      JOIN employees e ON ht.employee_id = e.id
      LEFT JOIN employees a ON ht.assigned_to = a.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'employee') { params.push(req.user.employee_id); query += ` AND ht.employee_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND ht.status = $${params.length}`; }
    if (category) { params.push(category); query += ` AND ht.category = $${params.length}`; }
    if (priority) { params.push(priority); query += ` AND ht.priority = $${params.length}`; }

    const countQuery = `SELECT COUNT(*) FROM (${query}) t`;
    const total = parseInt((await db.query(countQuery, params)).rows[0].count);

    params.push(limit); params.push(offset);
    query += ` ORDER BY ht.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateTicket = async (req, res) => {
  try {
    const { status, assignedTo, resolutionNotes } = req.body;
    const resolvedAt = status === 'resolved' ? new Date() : null;

    await db.query(
      'UPDATE helpdesk_tickets SET status=$1, assigned_to=$2, resolution_notes=$3, resolved_at=$4 WHERE id=$5',
      [status, assignedTo, resolutionNotes, resolvedAt, req.params.id]
    );

    res.json({ success: true, message: 'Ticket updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { comment, isInternal } = req.body;
    const result = await db.query(
      'INSERT INTO ticket_comments (ticket_id, author_id, comment, is_internal) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.params.id, req.user.employee_id, comment, isInternal || false]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getTicketComments = async (req, res) => {
  const result = await db.query(
    `SELECT tc.*, e.first_name || ' ' || e.last_name as author_name FROM ticket_comments tc
     JOIN employees e ON tc.author_id = e.id WHERE tc.ticket_id = $1 ORDER BY tc.created_at`,
    [req.params.id]
  );
  res.json({ success: true, data: result.rows });
};
