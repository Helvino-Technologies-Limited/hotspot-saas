require('dotenv').config();
const { pool } = require('./db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log('Starting database migration...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        logo_url TEXT,
        primary_color VARCHAR(7) DEFAULT '#0ea5e9',
        secondary_color VARCHAR(7) DEFAULT '#0369a1',
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','suspended','trial')),
        subscription_plan VARCHAR(50) DEFAULT 'basic',
        subscription_expires_at TIMESTAMPTZ,
        first_payment_paid BOOLEAN DEFAULT FALSE,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('superadmin','admin','staff')),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
        last_login TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        duration_minutes INTEGER NOT NULL,
        speed_limit_mbps DECIMAL(5,2),
        device_limit INTEGER DEFAULT 1,
        data_limit_mb INTEGER,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
        is_promotional BOOLEAN DEFAULT FALSE,
        promo_expires_at TIMESTAMPTZ,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        package_id UUID REFERENCES packages(id),
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'KES',
        method VARCHAR(50) NOT NULL,
        reference VARCHAR(255) UNIQUE,
        mpesa_receipt VARCHAR(100),
        phone_number VARCHAR(20),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vouchers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        package_id UUID REFERENCES packages(id),
        payment_id UUID REFERENCES payments(id),
        code VARCHAR(20) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'unused' CHECK (status IN ('unused','active','expired','revoked')),
        phone_number VARCHAR(20),
        expires_at TIMESTAMPTZ,
        activated_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        voucher_id UUID REFERENCES vouchers(id) ON DELETE CASCADE,
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        mac_address VARCHAR(17),
        ip_address VARCHAR(45),
        username VARCHAR(100),
        start_time TIMESTAMPTZ DEFAULT NOW(),
        end_time TIMESTAMPTZ,
        data_used_mb DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','expired','terminated')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS routers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        type VARCHAR(50) NOT NULL,
        nas_identifier VARCHAR(100),
        secret VARCHAR(255),
        port INTEGER DEFAULT 1812,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
        last_seen TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100),
        resource_id UUID,
        details JSONB DEFAULT '{}',
        ip_address VARCHAR(45),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
      CREATE INDEX IF NOT EXISTS idx_vouchers_tenant ON vouchers(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);
      CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
      CREATE INDEX IF NOT EXISTS idx_sessions_voucher ON sessions(voucher_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_tenant ON sessions(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_packages_tenant ON packages(tenant_id);
    `);

    // Add trial_ends_at column if it doesn't exist (idempotent upgrade)
    await client.query(`
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
    `);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

migrate().then(() => process.exit(0)).catch(() => process.exit(1));
