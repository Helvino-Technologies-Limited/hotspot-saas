const { query } = require('../utils/db');

/**
 * GET /api/settings — returns current tenant's settings (M-Pesa, bank, branding, portal)
 */
const getSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const result = await query(
      `SELECT name, email, phone, logo_url, primary_color, secondary_color, settings
       FROM tenants WHERE id = $1`,
      [tenantId]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Tenant not found' });

    const tenant = result.rows[0];
    const settings = tenant.settings || {};

    // Never send raw secrets to client — mask them
    const mpesa = settings.mpesa || {};
    const bank = settings.bank || {};
    const portal = settings.portal || {};

    res.json({
      success: true,
      data: {
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        logoUrl: tenant.logo_url,
        primaryColor: tenant.primary_color,
        secondaryColor: tenant.secondary_color,
        mpesa: {
          consumerKey: mpesa.consumerKey ? '••••' + mpesa.consumerKey.slice(-4) : '',
          consumerSecret: mpesa.consumerSecret ? '••••' + mpesa.consumerSecret.slice(-4) : '',
          shortcode: mpesa.shortcode || '',
          passkey: mpesa.passkey ? '••••' : '',
          env: mpesa.env || 'sandbox',
          callbackUrl: mpesa.callbackUrl || '',
          configured: !!(mpesa.consumerKey && mpesa.shortcode),
        },
        bank: {
          bankName: bank.bankName || '',
          accountNumber: bank.accountNumber || '',
          accountName: bank.accountName || '',
          paybill: bank.paybill || '',
          tillNumber: bank.tillNumber || '',
          airtelMoneyCode: bank.airtelMoneyCode || '',
        },
        portal: {
          welcomeMessage: portal.welcomeMessage || '',
          ssid: portal.ssid || '',
          supportPhone: portal.supportPhone || '',
          supportEmail: portal.supportEmail || '',
          footerText: portal.footerText || '',
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PUT /api/settings — update tenant settings
 * Accepts: mpesa, bank, portal, branding fields
 */
const updateSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { section, data } = req.body;

    if (!section || !data) return res.status(400).json({ success: false, message: 'section and data required' });

    const allowed = ['mpesa', 'bank', 'portal'];
    if (!allowed.includes(section)) return res.status(400).json({ success: false, message: 'Invalid section' });

    // Get current settings
    const current = await query('SELECT settings FROM tenants WHERE id=$1', [tenantId]);
    const existing = current.rows[0]?.settings || {};

    // Merge section — keep existing secrets if placeholder sent
    const sectionData = existing[section] || {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && value.startsWith('••••')) continue; // masked — keep original
      sectionData[key] = value;
    }
    existing[section] = sectionData;

    await query(
      'UPDATE tenants SET settings=$1, updated_at=NOW() WHERE id=$2',
      [JSON.stringify(existing), tenantId]
    );

    res.json({ success: true, message: `${section} settings saved` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PUT /api/settings/branding — update branding (name, colors, logo)
 */
const updateBranding = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { name, phone, logoUrl, primaryColor, secondaryColor } = req.body;

    await query(
      `UPDATE tenants SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        logo_url = COALESCE($3, logo_url),
        primary_color = COALESCE($4, primary_color),
        secondary_color = COALESCE($5, secondary_color),
        updated_at = NOW()
       WHERE id = $6`,
      [name, phone, logoUrl, primaryColor, secondaryColor, tenantId]
    );

    res.json({ success: true, message: 'Branding updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getSettings, updateSettings, updateBranding };
