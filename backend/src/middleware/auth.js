const jwt = require('jsonwebtoken');
const { query } = require('../utils/db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await query(
      'SELECT id, tenant_id, username, email, role, status FROM users WHERE id = $1 AND status = $2',
      [decoded.userId, 'active']
    );
    
    if (!result.rows.length) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }
    
    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  next();
};

const requireSuperAdmin = requireRole('superadmin');
const requireAdmin = requireRole('superadmin', 'admin');

module.exports = { authenticate, requireRole, requireSuperAdmin, requireAdmin };
