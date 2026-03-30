const { query } = require('../utils/db');
const { generateVoucherCode } = require('../utils/helpers');

const getVouchers = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;

    let conditions = ['v.tenant_id = $1'];
    let params = [tenantId];
    let idx = 2;

    if (status) { conditions.push(`v.status = $${idx++}`); params.push(status); }
    if (search) { conditions.push(`v.code ILIKE $${idx++}`); params.push(`%${search}%`); }

    const where = 'WHERE ' + conditions.join(' AND ');
    const countRes = await query(`SELECT COUNT(*) FROM vouchers v ${where}`, params);
    params.push(limit, offset);

    const result = await query(`
      SELECT v.*, pk.name as package_name, pk.duration_minutes, pk.price,
             s.mac_address, s.ip_address, s.start_time as session_start
      FROM vouchers v
      LEFT JOIN packages pk ON pk.id = v.package_id
      LEFT JOIN sessions s ON s.voucher_id = v.id AND s.status = 'active'
      ${where} ORDER BY v.created_at DESC LIMIT $${idx++} OFFSET $${idx++}
    `, params);

    res.json({
      success: true, data: result.rows,
      pagination: { total: parseInt(countRes.rows[0].count), page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const generateManualVoucher = async (req, res) => {
  try {
    const { packageId, count = 1, phoneNumber } = req.body;
    const tenantId = req.user.tenant_id;

    if (!packageId) return res.status(400).json({ success: false, message: 'Package ID required' });

    const pkg = await query('SELECT * FROM packages WHERE id=$1 AND tenant_id=$2', [packageId, tenantId]);
    if (!pkg.rows.length) return res.status(404).json({ success: false, message: 'Package not found' });

    const vouchers = [];
    const n = Math.min(count, 100);
    for (let i = 0; i < n; i++) {
      const code = generateVoucherCode();
      const v = await query(`
        INSERT INTO vouchers (tenant_id, package_id, code, status, phone_number)
        VALUES ($1,$2,$3,'unused',$4) RETURNING *
      `, [tenantId, packageId, code, phoneNumber]);
      vouchers.push(v.rows[0]);
    }

    res.status(201).json({ success: true, data: vouchers, message: `${n} voucher(s) generated` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const redeemVoucher = async (req, res) => {
  try {
    const { code, macAddress, ipAddress, tenantSlug } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Voucher code required' });

    let tenantId;
    if (tenantSlug) {
      const t = await query('SELECT id FROM tenants WHERE slug=$1 AND status=$2', [tenantSlug, 'active']);
      if (!t.rows.length) return res.status(404).json({ success: false, message: 'Provider not found' });
      tenantId = t.rows[0].id;
    }

    const conditions = ['UPPER(v.code) = UPPER($1)', "v.status = 'unused'"];
    const params = [code.trim()];
    if (tenantId) { conditions.push(`v.tenant_id = $2`); params.push(tenantId); }
    
    const voucherRes = await query(`
      SELECT v.*, pk.duration_minutes, pk.speed_limit_mbps, pk.name as package_name
      FROM vouchers v JOIN packages pk ON pk.id = v.package_id
      WHERE ${conditions.join(' AND ')}
    `, params);

    if (!voucherRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Invalid or already used voucher code' });
    }

    const voucher = voucherRes.rows[0];

    // --- Single-device enforcement ---
    // Get the package device_limit
    const pkgRes = await query('SELECT device_limit FROM packages WHERE id=$1', [voucher.package_id]);
    const deviceLimit = pkgRes.rows[0]?.device_limit || 1;

    // Check existing active sessions for this voucher
    const activeSessions = await query(
      `SELECT mac_address FROM sessions WHERE voucher_id=$1 AND status='active'`,
      [voucher.id]
    );

    if (activeSessions.rowCount >= deviceLimit) {
      // Check if this MAC is already in the allowed list
      const knownMac = activeSessions.rows.find(s => s.mac_address === macAddress);
      if (!knownMac) {
        return res.status(403).json({
          success: false,
          message: `This voucher is already in use on ${deviceLimit === 1 ? 'another device' : `${deviceLimit} devices`}. Each code works on ${deviceLimit} device${deviceLimit > 1 ? 's' : ''} only.`,
        });
      }
    }

    const expiresAt = new Date(Date.now() + voucher.duration_minutes * 60 * 1000);

    // Bind first MAC to the voucher record
    const bindMac = activeSessions.rowCount === 0 && macAddress ? macAddress : undefined;
    await query(
      `UPDATE vouchers SET status='active', activated_at=NOW(), expires_at=$1, updated_at=NOW()
       ${bindMac ? ', bound_mac=$3' : ''}
       WHERE id=$2`,
      bindMac ? [expiresAt, voucher.id, bindMac] : [expiresAt, voucher.id]
    );

    await query(`
      INSERT INTO sessions (voucher_id, tenant_id, mac_address, ip_address, username)
      VALUES ($1,$2,$3,$4,$5)
    `, [voucher.id, voucher.tenant_id, macAddress, ipAddress, voucher.code]);

    res.json({
      success: true,
      message: 'Voucher activated successfully',
      data: {
        code: voucher.code,
        packageName: voucher.package_name,
        durationMinutes: voucher.duration_minutes,
        expiresAt,
        speedLimitMbps: voucher.speed_limit_mbps,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const revokeVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;
    const result = await query(
      `UPDATE vouchers SET status='revoked', updated_at=NOW() WHERE id=$1 AND tenant_id=$2 RETURNING *`,
      [id, tenantId]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Voucher not found' });
    res.json({ success: true, message: 'Voucher revoked' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getVoucherStats = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const stats = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status='unused') as unused,
        COUNT(*) FILTER (WHERE status='active') as active,
        COUNT(*) FILTER (WHERE status='expired') as expired,
        COUNT(*) FILTER (WHERE status='revoked') as revoked,
        COUNT(*) FILTER (WHERE created_at > NOW()-INTERVAL '24h') as today,
        COUNT(*) as total
      FROM vouchers WHERE tenant_id=$1
    `, [tenantId]);
    res.json({ success: true, data: stats.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getVouchers, generateManualVoucher, redeemVoucher, revokeVoucher, getVoucherStats };
