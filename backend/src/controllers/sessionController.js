const { query } = require('../utils/db');

const getSessions = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let conditions = ['s.tenant_id = $1'];
    let params = [tenantId];
    let idx = 2;
    if (status) { conditions.push(`s.status = $${idx++}`); params.push(status); }

    const where = 'WHERE ' + conditions.join(' AND ');
    const countRes = await query(`SELECT COUNT(*) FROM sessions s ${where}`, params);
    params.push(limit, offset);

    const result = await query(`
      SELECT s.*, v.code as voucher_code, pk.name as package_name, pk.duration_minutes,
             v.expires_at
      FROM sessions s
      LEFT JOIN vouchers v ON v.id = s.voucher_id
      LEFT JOIN packages pk ON pk.id = v.package_id
      ${where} ORDER BY s.start_time DESC LIMIT $${idx++} OFFSET $${idx++}
    `, params);

    res.json({
      success: true, data: result.rows,
      pagination: { total: parseInt(countRes.rows[0].count), page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const terminateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;
    
    const result = await query(
      `UPDATE sessions SET status='terminated', end_time=NOW() WHERE id=$1 AND tenant_id=$2 RETURNING *`,
      [id, tenantId]
    );
    
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Session not found' });
    
    // Also expire the voucher
    await query(
      `UPDATE vouchers SET status='expired', updated_at=NOW() WHERE id=$1`,
      [result.rows[0].voucher_id]
    );

    res.json({ success: true, message: 'Session terminated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSessionStats = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const stats = await query(`
      SELECT
        COUNT(*) FILTER (WHERE s.status='active') as active_now,
        COUNT(*) FILTER (WHERE s.start_time > NOW()-INTERVAL '24h') as today,
        COUNT(*) FILTER (WHERE s.start_time > NOW()-INTERVAL '7 days') as this_week,
        COUNT(*) as total,
        COALESCE(SUM(s.data_used_mb),0) as total_data_mb
      FROM sessions s WHERE s.tenant_id=$1
    `, [tenantId]);
    res.json({ success: true, data: stats.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getSessions, terminateSession, getSessionStats };
