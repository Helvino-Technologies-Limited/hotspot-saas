const cron = require('node-cron');
const { query } = require('../utils/db');

const expireVouchers = async () => {
  try {
    const result = await query(`
      UPDATE vouchers SET status='expired', updated_at=NOW()
      WHERE status='active' AND expires_at < NOW()
      RETURNING id
    `);
    if (result.rowCount > 0) {
      await query(`
        UPDATE sessions SET status='expired', end_time=NOW()
        WHERE voucher_id = ANY($1::uuid[]) AND status='active'
      `, [result.rows.map(r => r.id)]);
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

const startCronJobs = () => {
  // Every minute: expire vouchers
  cron.schedule('* * * * *', expireVouchers);
  // Every 15 minutes: cleanup pending payments
  cron.schedule('*/15 * * * *', cleanupExpiredPayments);
  console.log('Cron jobs started');
};

module.exports = { startCronJobs };
