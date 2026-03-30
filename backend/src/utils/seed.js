require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('./db');

const seed = async () => {
  try {
    console.log('Seeding database...');

    // Super Admin user (no tenant)
    const hashedPassword = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD || 'Mycat@95', 12);
    await query(`
      INSERT INTO users (username, email, password_hash, role, tenant_id)
      VALUES ('Super Admin', $1, $2, 'superadmin', NULL)
      ON CONFLICT (email) DO UPDATE SET password_hash = $2, role = 'superadmin'
    `, [process.env.SUPER_ADMIN_EMAIL || 'helvinotechltd@gmail.com', hashedPassword]);

    // Demo tenant
    const tenantRes = await query(`
      INSERT INTO tenants (name, slug, email, phone, primary_color, status, first_payment_paid)
      VALUES ('Demo ISP', 'demo-isp', 'demo@demohotspot.com', '0700000000', '#0ea5e9', 'active', true)
      ON CONFLICT (slug) DO UPDATE SET name = 'Demo ISP'
      RETURNING id
    `);
    const tenantId = tenantRes.rows[0].id;

    // Demo admin
    const adminPass = await bcrypt.hash('Admin@123', 12);
    await query(`
      INSERT INTO users (tenant_id, username, email, password_hash, role)
      VALUES ($1, 'Demo Admin', 'admin@demohotspot.com', $2, 'admin')
      ON CONFLICT (email) DO UPDATE SET password_hash = $2
    `, [tenantId, adminPass]);

    // Demo packages
    const packages = [
      { name: '30 Minutes', price: 5, duration: 30, speed: 2, devices: 1 },
      { name: '1 Hour', price: 10, duration: 60, speed: 5, devices: 1 },
      { name: '2 Hours', price: 20, duration: 120, speed: 5, devices: 2 },
      { name: 'Daily', price: 50, duration: 1440, speed: 10, devices: 2 },
      { name: 'Weekly', price: 250, duration: 10080, speed: 10, devices: 3 },
      { name: 'Monthly', price: 800, duration: 43200, speed: 20, devices: 3 },
    ];

    for (let i = 0; i < packages.length; i++) {
      const p = packages[i];
      await query(`
        INSERT INTO packages (tenant_id, name, price, duration_minutes, speed_limit_mbps, device_limit, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
      `, [tenantId, p.name, p.price, p.duration, p.speed, p.devices, i]);
    }

    console.log('Seeding completed!');
    console.log('Super Admin:', process.env.SUPER_ADMIN_EMAIL, '/', process.env.SUPER_ADMIN_PASSWORD);
    console.log('Demo Admin: admin@demohotspot.com / Admin@123');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  }
};

seed().then(() => process.exit(0)).catch(() => process.exit(1));
