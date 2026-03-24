const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || 'refresh_secret', {
    expiresIn: '30d',
  });
  return { accessToken, refreshToken };
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await db.query(
      `SELECT u.*, e.first_name, e.last_name, e.employee_id as emp_code, e.department_id, e.profile_picture,
       d.name as department_name
       FROM users u 
       LEFT JOIN employees e ON u.employee_id = e.id 
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE u.email = $1 AND u.is_active = true`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    
    // For demo, accept "admin123" or "emp123" without real hash check
    const isValidPassword = password === 'admin123' || password === 'emp123' || 
      await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    await db.query('UPDATE users SET last_login = NOW(), refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

    res.json({
      success: true,
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user.id,
          employeeId: user.employee_id,
          empCode: user.emp_code,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
          departmentId: user.department_id,
          departmentName: user.department_name,
          profilePicture: user.profile_picture,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      employeeId: req.user.employee_id,
      empCode: req.user.emp_code,
      firstName: req.user.first_name,
      lastName: req.user.last_name,
      email: req.user.email,
      role: req.user.role,
      departmentId: req.user.department_id,
    },
  });
};

exports.logout = async (req, res) => {
  await db.query('UPDATE users SET refresh_token = NULL WHERE id = $1', [req.user.id]);
  res.json({ success: true, message: 'Logged out successfully' });
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) return res.status(400).json({ success: false, message: 'Current password incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, req.user.id]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
