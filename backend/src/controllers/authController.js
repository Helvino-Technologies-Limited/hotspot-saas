const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../utils/db');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const result = await query(
      `SELECT u.*, t.name as tenant_name, t.slug as tenant_slug, t.status as tenant_status,
              t.primary_color, t.secondary_color, t.logo_url,
              t.trial_ends_at, t.subscription_expires_at, t.first_payment_paid
       FROM users u
       LEFT JOIN tenants t ON u.tenant_id = t.id
       WHERE u.email = $1 AND u.status = 'active'`,
      [email.toLowerCase().trim()]
    );

    if (!result.rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.role !== 'superadmin' && ['inactive', 'suspended'].includes(user.tenant_status)) {
      return res.status(403).json({ success: false, message: 'Your account is inactive. Please make payment to activate your subscription.' });
    }

    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = jwt.sign(
      { userId: user.id, role: user.role, tenantId: user.tenant_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
        tenantName: user.tenant_name,
        tenantSlug: user.tenant_slug,
        tenantStatus: user.tenant_status,
        primaryColor: user.primary_color,
        secondaryColor: user.secondary_color,
        logoUrl: user.logo_url,
        trialEndsAt: user.trial_ends_at,
        subscriptionExpiresAt: user.subscription_expires_at,
        firstPaymentPaid: user.first_payment_paid,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const me = async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.username, u.email, u.role, u.tenant_id, u.last_login,
              t.name as tenant_name, t.slug as tenant_slug, t.status as tenant_status,
              t.primary_color, t.secondary_color, t.logo_url, t.settings,
              t.trial_ends_at, t.subscription_expires_at, t.first_payment_paid
       FROM users u
       LEFT JOIN tenants t ON u.tenant_id = t.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
        tenantName: user.tenant_name,
        tenantSlug: user.tenant_slug,
        tenantStatus: user.tenant_status,
        primaryColor: user.primary_color,
        secondaryColor: user.secondary_color,
        logoUrl: user.logo_url,
        settings: user.settings,
        lastLogin: user.last_login,
        trialEndsAt: user.trial_ends_at,
        subscriptionExpiresAt: user.subscription_expires_at,
        firstPaymentPaid: user.first_payment_paid,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both passwords required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.id]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const registerTenant = async (req, res) => {
  try {
    const { businessName, email, phone, adminName, password } = req.body;

    if (!businessName || !email || !adminName || !password) {
      return res.status(400).json({ success: false, message: 'Business name, email, admin name and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 5);

    const tenantRes = await query(`
      INSERT INTO tenants (name, slug, email, phone, status, trial_ends_at)
      VALUES ($1, $2, $3, $4, 'trial', $5)
      RETURNING *
    `, [businessName, slug, email.toLowerCase().trim(), phone || null, trialEndsAt]);

    const tenant = tenantRes.rows[0];

    const hash = await bcrypt.hash(password, 12);
    const userRes = await query(`
      INSERT INTO users (tenant_id, username, email, password_hash, role)
      VALUES ($1, $2, $3, $4, 'admin')
      RETURNING *
    `, [tenant.id, adminName, email.toLowerCase().trim(), hash]);

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

    const user = userRes.rows[0];
    const token = jwt.sign(
      { userId: user.id, role: user.role, tenantId: user.tenant_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        tenantStatus: tenant.status,
        primaryColor: tenant.primary_color,
        trialEndsAt: tenant.trial_ends_at,
        firstPaymentPaid: false,
      },
      message: `Registration successful! Your 5-day free trial has started.`
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'A business with this email or name already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { login, me, changePassword, registerTenant };
