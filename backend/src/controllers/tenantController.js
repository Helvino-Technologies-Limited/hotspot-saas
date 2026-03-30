const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../utils/db');

const getAllTenants = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];
    let idx = 1;

    if (status) { conditions.push(`t.status = $${idx++}`); params.push(status); }
    if (search) {
      conditions.push(`(t.name ILIKE $${idx} OR t.email ILIKE $${idx} OR t.slug ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const countRes = await query(`SELECT COUNT(*) FROM tenants t ${where}`, params);
    
    params.push(limit, offset);
    const result = await query(`
      SELECT t.*, 
        (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) as user_count,
        (SELECT COUNT(*) FROM vouchers v WHERE v.tenant_id = t.id) as voucher_count,
        (SELECT COALESCE(SUM(p.amount),0) FROM payments p WHERE p.tenant_id = t.id AND p.status = 'completed') as total_revenue
      FROM tenants t ${where}
      ORDER BY t.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countRes.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countRes.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createTenant = async (req, res) => {
  try {
    const { name, slug, email, phone, adminEmail, adminPassword, adminName, primaryColor } = req.body;
    
    if (!name || !email || !adminEmail || !adminPassword) {
      return res.status(400).json({ success: false, message: 'Name, email, admin email and password required' });
    }

    const slugVal = slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    
    const tenantRes = await query(`
      INSERT INTO tenants (name, slug, email, phone, primary_color, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING *
    `, [name, slugVal, email, phone, primaryColor || '#0ea5e9']);

    const tenant = tenantRes.rows[0];
    const hash = await bcrypt.hash(adminPassword, 12);
    
    await query(`
      INSERT INTO users (tenant_id, username, email, password_hash, role)
      VALUES ($1, $2, $3, $4, 'admin')
    `, [tenant.id, adminName || name + ' Admin', adminEmail, hash]);

    // Default packages
    const defaults = [
      { name: '1 Hour', price: 10, duration: 60, speed: 5 },
      { name: 'Daily', price: 50, duration: 1440, speed: 10 },
      { name: 'Weekly', price: 250, duration: 10080, speed: 10 },
    ];
    for (let i = 0; i < defaults.length; i++) {
      const p = defaults[i];
      await query(
        'INSERT INTO packages (tenant_id, name, price, duration_minutes, speed_limit_mbps, sort_order) VALUES ($1,$2,$3,$4,$5,$6)',
        [tenant.id, p.name, p.price, p.duration, p.speed, i]
      );
    }

    res.status(201).json({ success: true, data: tenant, message: 'Tenant created successfully' });
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Tenant slug or email already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT t.*,
        (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) as user_count,
        (SELECT COALESCE(SUM(p.amount),0) FROM payments p WHERE p.tenant_id = t.id AND p.status='completed') as total_revenue,
        (SELECT COUNT(*) FROM vouchers v WHERE v.tenant_id = t.id) as total_vouchers,
        (SELECT COUNT(*) FROM sessions s WHERE s.tenant_id = t.id AND s.status='active') as active_sessions
      FROM tenants t WHERE t.id = $1
    `, [id]);
    
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Tenant not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, status, primaryColor, secondaryColor, logoUrl, settings } = req.body;

    const result = await query(`
      UPDATE tenants SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        status = COALESCE($4, status),
        primary_color = COALESCE($5, primary_color),
        secondary_color = COALESCE($6, secondary_color),
        logo_url = COALESCE($7, logo_url),
        settings = COALESCE($8, settings),
        updated_at = NOW()
      WHERE id = $9 RETURNING *
    `, [name, email, phone, status, primaryColor, secondaryColor, logoUrl, settings ? JSON.stringify(settings) : null, id]);

    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Tenant not found' });
    res.json({ success: true, data: result.rows[0], message: 'Tenant updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const toggleTenantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE tenants SET status = CASE WHEN status='active' THEN 'inactive' ELSE 'active' END, updated_at=NOW() WHERE id=$1 RETURNING *`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Tenant not found' });
    res.json({ success: true, data: result.rows[0], message: `Tenant ${result.rows[0].status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const impersonateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = await query(
      `SELECT u.*, t.name as tenant_name, t.slug, t.primary_color, t.secondary_color, t.logo_url
       FROM users u JOIN tenants t ON u.tenant_id = t.id
       WHERE u.tenant_id = $1 AND u.role = 'admin' AND u.status = 'active' LIMIT 1`,
      [id]
    );
    
    if (!adminUser.rows.length) {
      return res.status(404).json({ success: false, message: 'No admin user found for this tenant' });
    }

    const user = adminUser.rows[0];
    const token = jwt.sign(
      { userId: user.id, role: user.role, tenantId: user.tenant_id, impersonatedBy: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id, username: user.username, email: user.email, role: user.role,
        tenantId: user.tenant_id, tenantName: user.tenant_name, tenantSlug: user.slug,
        primaryColor: user.primary_color, logoUrl: user.logo_url,
        isImpersonated: true
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSuperAdminStats = async (req, res) => {
  try {
    const stats = await query(`
      SELECT
        (SELECT COUNT(*) FROM tenants) as total_tenants,
        (SELECT COUNT(*) FROM tenants WHERE status='active') as active_tenants,
        (SELECT COUNT(*) FROM users WHERE role != 'superadmin') as total_users,
        (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='completed') as total_revenue,
        (SELECT COUNT(*) FROM vouchers WHERE created_at > NOW()-INTERVAL '24 hours') as vouchers_today,
        (SELECT COUNT(*) FROM sessions WHERE status='active') as active_sessions,
        (SELECT COUNT(*) FROM payments WHERE status='completed' AND created_at > NOW()-INTERVAL '24 hours') as payments_today,
        (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='completed' AND created_at > NOW()-INTERVAL '30 days') as revenue_30days
    `);

    const revenueByMonth = await query(`
      SELECT DATE_TRUNC('month', created_at) as month, COALESCE(SUM(amount),0) as revenue
      FROM payments WHERE status='completed' AND created_at > NOW()-INTERVAL '6 months'
      GROUP BY month ORDER BY month
    `);

    res.json({ success: true, data: { ...stats.rows[0], revenueByMonth: revenueByMonth.rows } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAllTenants, createTenant, getTenant, updateTenant, toggleTenantStatus, impersonateTenant, getSuperAdminStats };
