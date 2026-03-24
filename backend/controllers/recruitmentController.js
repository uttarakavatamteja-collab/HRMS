const db = require('../config/database');

exports.getJobPostings = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT jp.*, d.name as department_name, des.title as designation_title,
             e.first_name || ' ' || e.last_name as posted_by_name,
             COUNT(c.id) as applicant_count
      FROM job_postings jp
      LEFT JOIN departments d ON jp.department_id = d.id
      LEFT JOIN designations des ON jp.designation_id = des.id
      LEFT JOIN employees e ON jp.posted_by = e.id
      LEFT JOIN candidates c ON jp.id = c.job_posting_id
      WHERE 1=1
    `;
    const params = [];
    if (status) { params.push(status); query += ` AND jp.status = $${params.length}`; }
    query += ' GROUP BY jp.id, d.name, des.title, e.first_name, e.last_name ORDER BY jp.created_at DESC';
    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createJobPosting = async (req, res) => {
  try {
    const { title, departmentId, designationId, description, requirements, experienceMin, experienceMax,
      salaryMin, salaryMax, location, employmentType, openings, closingDate } = req.body;

    const result = await db.query(
      `INSERT INTO job_postings (title, department_id, designation_id, description, requirements, experience_min,
       experience_max, salary_min, salary_max, location, employment_type, openings, posted_by, closing_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [title, departmentId, designationId, description, requirements, experienceMin, experienceMax,
       salaryMin, salaryMax, location, employmentType, openings, req.user.employee_id, closingDate]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getCandidates = async (req, res) => {
  try {
    const { jobPostingId, stage } = req.query;
    let query = `
      SELECT c.*, jp.title as job_title
      FROM candidates c
      JOIN job_postings jp ON c.job_posting_id = jp.id
      WHERE 1=1
    `;
    const params = [];
    if (jobPostingId) { params.push(jobPostingId); query += ` AND c.job_posting_id = $${params.length}`; }
    if (stage) { params.push(stage); query += ` AND c.stage = $${params.length}`; }
    query += ' ORDER BY c.created_at DESC';
    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateCandidateStage = async (req, res) => {
  try {
    const { stage, notes } = req.body;
    await db.query('UPDATE candidates SET stage=$1, notes=$2 WHERE id=$3', [stage, notes, req.params.id]);
    res.json({ success: true, message: 'Stage updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
