const { query } = require('../utils/db');

const getDashboardStats = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;

    const stats = await query(`
      SELECT
        (SELECT COALESCE(SUM(amount),0) FROM payments WHERE tenant_id=$1 AND status='completed' AND created_at > NOW()-INTERVAL '30 days') as revenue_month,
        (SELECT COALESCE(SUM(amount),0) FROM payments WHERE tenant_id=$1 AND status='completed' AND created_at > NOW()-INTERVAL '7 days') as revenue_week,
        (SELECT COALESCE(SUM(amount),0) FROM payments WHERE tenant_id=$1 AND status='completed' AND DATE(created_at)=CURRENT_DATE) as revenue_today,
        (SELECT COUNT(*) FROM sessions WHERE tenant_id=$1 AND status='active') as active_sessions,
        (SELECT COUNT(*) FROM vouchers WHERE tenant_id=$1 AND status='unused') as unused_vouchers,
        (SELECT COUNT(*) FROM vouchers WHERE tenant_id=$1 AND status='active') as active_vouchers,
        (SELECT COUNT(*) FROM payments WHERE tenant_id=$1 AND status='completed' AND DATE(created_at)=CURRENT_DATE) as sales_today,
        (SELECT COUNT(*) FROM packages WHERE tenant_id=$1 AND status='active') as active_packages
    `, [tenantId]);

    const revenueChart = await query(`
      SELECT DATE(created_at) as date, COALESCE(SUM(amount),0) as revenue, COUNT(*) as sales
      FROM payments WHERE tenant_id=$1 AND status='completed' AND created_at > NOW()-INTERVAL '14 days'
      GROUP BY DATE(created_at) ORDER BY date
    `, [tenantId]);

    const topPackages = await query(`
      SELECT pk.name, COUNT(v.id) as sales, COALESCE(SUM(p.amount),0) as revenue
      FROM packages pk
      LEFT JOIN vouchers v ON v.package_id = pk.id
      LEFT JOIN payments p ON p.package_id = pk.id AND p.status='completed'
      WHERE pk.tenant_id=$1
      GROUP BY pk.id, pk.name ORDER BY sales DESC LIMIT 5
    `, [tenantId]);

    const recentPayments = await query(`
      SELECT p.id, p.amount, p.method, p.status, p.created_at, pk.name as package_name, v.code as voucher_code
      FROM payments p
      LEFT JOIN packages pk ON pk.id = p.package_id
      LEFT JOIN vouchers v ON v.payment_id = p.id
      WHERE p.tenant_id=$1 ORDER BY p.created_at DESC LIMIT 10
    `, [tenantId]);

    const hourlyUsage = await query(`
      SELECT EXTRACT(HOUR FROM start_time) as hour, COUNT(*) as sessions
      FROM sessions WHERE tenant_id=$1 AND start_time > NOW()-INTERVAL '7 days'
      GROUP BY hour ORDER BY hour
    `, [tenantId]);

    res.json({
      success: true,
      data: {
        stats: stats.rows[0],
        revenueChart: revenueChart.rows,
        topPackages: topPackages.rows,
        recentPayments: recentPayments.rows,
        hourlyUsage: hourlyUsage.rows,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getDashboardStats };
