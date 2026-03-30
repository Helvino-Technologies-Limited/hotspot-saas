const cron = require('node-cron');
const { query } = require('../utils/db');
const { disconnectUser } = require('./mikrotikService');

const expireVouchers = async () => {
  try {
    // Find vouchers about to expire
    const result = await query(`
      UPDATE vouchers SET status='expired', updated_at=NOW()
      WHERE status='active' AND expires_at < NOW()
      RETURNING id, code, tenant_id
    `);

    if (result.rowCount > 0) {
      const voucherIds = result.rows.map(r => r.id);

      // Expire sessions
      await query(`
        UPDATE sessions SET status='expired', end_time=NOW()
        WHERE voucher_id = ANY($1::uuid[]) AND status='active'
      `, [voucherIds]);

      // Disconnect from MikroTik routers that have use_api enabled
      for (const voucher of result.rows) {
        try {
          const routers = await query(
            `SELECT * FROM routers WHERE tenant_id=$1 AND status='active' AND use_api=true AND type='MikroTik'`,
            [voucher.tenant_id]
          );
          for (const router of routers.rows) {
            await disconnectUser(router, voucher.code);
          }
        } catch (err) {
          console.error(`Router disconnect error for voucher ${voucher.code}:`, err.message);
        }
      }

      console.log(`Expired ${result.rowCount} vouchers`);
    }
  } catch (error) {
    console.error('Cron expire vouchers error:', error);
  }
};

const cleanupExpiredPayments = async () => {
  try {
    await query(`
      UPDATE payments SET status='failed', updated_at=NOW()
      WHERE status='pending' AND created_at < NOW()-INTERVAL '30 minutes'
    `);
  } catch (error) {
    console.error('Cron cleanup payments error:', error);
  }
};

const deactivateExpiredTrials = async () => {
  try {
    const result = await query(`
      UPDATE tenants SET status='inactive', updated_at=NOW()
      WHERE status='trial' AND trial_ends_at < NOW()
      RETURNING id, name, email
    `);
    if (result.rowCount > 0) {
      console.log(`Deactivated ${result.rowCount} expired trial account(s):`, result.rows.map(r => r.name).join(', '));
    }
  } catch (error) {
    console.error('Cron deactivate trials error:', error);
  }
};

const startCronJobs = () => {
  cron.schedule('* * * * *', expireVouchers);            // Every minute
  cron.schedule('*/15 * * * *', cleanupExpiredPayments); // Every 15 minutes
  cron.schedule('0 * * * *', deactivateExpiredTrials);   // Every hour
  console.log('Cron jobs started');
};

module.exports = { startCronJobs };
