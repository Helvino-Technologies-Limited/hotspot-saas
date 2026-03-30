const { query } = require('../utils/db');

const getPackages = async (req, res) => {
  try {
    const tenantId = req.user.role === 'superadmin' ? req.query.tenantId : req.user.tenant_id;
    if (!tenantId) return res.status(400).json({ success: false, message: 'Tenant ID required' });

    const result = await query(
      `SELECT p.*,
        (SELECT COUNT(*) FROM vouchers v WHERE v.package_id = p.id) as voucher_count,
        (SELECT COALESCE(SUM(pay.amount),0) FROM payments pay WHERE pay.package_id = p.id AND pay.status='completed') as revenue
       FROM packages p WHERE p.tenant_id = $1 ORDER BY p.sort_order, p.price`,
      [tenantId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPublicPackages = async (req, res) => {
  try {
    const { tenantSlug } = req.params;
    const tenantRes = await query(
      `SELECT id, name, primary_color, secondary_color, logo_url, settings FROM tenants WHERE slug = $1 AND status = 'active'`,
      [tenantSlug]
    );
    if (!tenantRes.rows.length) return res.status(404).json({ success: false, message: 'Provider not found' });
    const tenant = tenantRes.rows[0];

    const packages = await query(
      `SELECT id, name, description, price, duration_minutes, speed_limit_mbps, device_limit, data_limit_mb
       FROM packages WHERE tenant_id = $1 AND status = 'active' ORDER BY sort_order, price`,
      [tenant.id]
    );

    res.json({ success: true, tenant, packages: packages.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createPackage = async (req, res) => {
  try {
    const { name, description, price, durationMinutes, speedLimitMbps, deviceLimit, dataLimitMb, status, sortOrder } = req.body;
    const tenantId = req.user.tenant_id;

    if (!name || !price || !durationMinutes) {
      return res.status(400).json({ success: false, message: 'Name, price and duration required' });
    }

    const result = await query(`
      INSERT INTO packages (tenant_id, name, description, price, duration_minutes, speed_limit_mbps, device_limit, data_limit_mb, status, sort_order)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [tenantId, name, description, price, durationMinutes, speedLimitMbps, deviceLimit || 1, dataLimitMb, status || 'active', sortOrder || 0]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, durationMinutes, speedLimitMbps, deviceLimit, dataLimitMb, status, sortOrder } = req.body;
    const tenantId = req.user.tenant_id;

    const result = await query(`
      UPDATE packages SET
        name = COALESCE($1, name), description = COALESCE($2, description),
        price = COALESCE($3, price), duration_minutes = COALESCE($4, duration_minutes),
        speed_limit_mbps = COALESCE($5, speed_limit_mbps), device_limit = COALESCE($6, device_limit),
        data_limit_mb = COALESCE($7, data_limit_mb), status = COALESCE($8, status),
        sort_order = COALESCE($9, sort_order), updated_at = NOW()
      WHERE id = $10 AND tenant_id = $11 RETURNING *
    `, [name, description, price, durationMinutes, speedLimitMbps, deviceLimit, dataLimitMb, status, sortOrder, id, tenantId]);

    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Package not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;
    const result = await query('DELETE FROM packages WHERE id = $1 AND tenant_id = $2 RETURNING id', [id, tenantId]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Package not found' });
    res.json({ success: true, message: 'Package deleted' });
  } catch (error) {
    if (error.code === '23503') return res.status(400).json({ success: false, message: 'Cannot delete package with existing vouchers' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getPackages, getPublicPackages, createPackage, updatePackage, deletePackage };
