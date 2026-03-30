const { query } = require('../utils/db');
const { generateVoucherCode } = require('../utils/helpers');
const { sendVoucherSms } = require('../services/smsService');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

/**
 * Resolve M-Pesa credentials: prefer tenant settings, fall back to env vars
 */
const getMpesaCreds = async (tenantId) => {
  if (tenantId) {
    const t = await query('SELECT settings FROM tenants WHERE id=$1', [tenantId]);
    const mpesa = t.rows[0]?.settings?.mpesa;
    if (mpesa?.consumerKey && mpesa?.shortcode) {
      return {
        consumerKey: mpesa.consumerKey,
        consumerSecret: mpesa.consumerSecret,
        shortcode: mpesa.shortcode,
        passkey: mpesa.passkey,
        env: mpesa.env || 'sandbox',
        callbackUrl: mpesa.callbackUrl || process.env.MPESA_CALLBACK_URL,
      };
    }
  }
  return {
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    shortcode: process.env.MPESA_SHORTCODE,
    passkey: process.env.MPESA_PASSKEY,
    env: process.env.MPESA_ENV || 'sandbox',
    callbackUrl: process.env.MPESA_CALLBACK_URL,
  };
};

const getMpesaToken = async (creds) => {
  const auth = Buffer.from(`${creds.consumerKey}:${creds.consumerSecret}`).toString('base64');
  const url = creds.env === 'production'
    ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
  const res = await axios.get(url, { headers: { Authorization: `Basic ${auth}` } });
  return res.data.access_token;
};

const initiateMpesaSTK = async (req, res) => {
  try {
    const { packageId, phoneNumber, tenantSlug } = req.body;
    if (!packageId || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'Package ID and phone number required' });
    }

    let tenantId;
    if (tenantSlug) {
      const t = await query('SELECT id FROM tenants WHERE slug=$1 AND status=$2', [tenantSlug, 'active']);
      if (!t.rows.length) return res.status(404).json({ success: false, message: 'Provider not found' });
      tenantId = t.rows[0].id;
    } else {
      tenantId = req.user?.tenant_id;
    }

    const pkg = await query('SELECT * FROM packages WHERE id=$1 AND tenant_id=$2 AND status=$3', [packageId, tenantId, 'active']);
    if (!pkg.rows.length) return res.status(404).json({ success: false, message: 'Package not found' });
    const pack = pkg.rows[0];

    // Format phone
    let phone = phoneNumber.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    if (!phone.startsWith('254')) phone = '254' + phone;

    const reference = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();

    // Create pending payment
    const paymentRes = await query(`
      INSERT INTO payments (tenant_id, package_id, amount, method, reference, phone_number, status)
      VALUES ($1,$2,$3,'mpesa',$4,$5,'pending') RETURNING *
    `, [tenantId, packageId, pack.price, reference, phone]);

    const payment = paymentRes.rows[0];

    // Resolve per-tenant credentials
    const creds = await getMpesaCreds(tenantId);

    // For demo/sandbox, simulate success
    if (creds.env === 'sandbox' || !creds.consumerKey || creds.consumerKey === 'your_consumer_key') {
      // Auto-complete after 3 seconds in sandbox
      setTimeout(async () => {
        try {
          await completPayment(payment.id, 'SANDBOX' + reference);
        } catch(e) { console.error('Sandbox auto-complete error:', e); }
      }, 3000);

      return res.json({
        success: true,
        message: 'Payment request sent to phone (sandbox mode — auto-completing in 3s)',
        paymentId: payment.id,
        reference,
        sandbox: true
      });
    }

    // Real M-Pesa STK Push using tenant credentials
    const token = await getMpesaToken(creds);
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${creds.shortcode}${creds.passkey}${timestamp}`).toString('base64');

    const stkRes = await axios.post(
      'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: creds.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.ceil(pack.price),
        PartyA: phone,
        PartyB: creds.shortcode,
        PhoneNumber: phone,
        CallBackURL: creds.callbackUrl,
        AccountReference: reference,
        TransactionDesc: `WiFi ${pack.name}`,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await query('UPDATE payments SET metadata=$1 WHERE id=$2', [JSON.stringify(stkRes.data), payment.id]);

    res.json({ success: true, message: 'Check your phone for payment prompt', paymentId: payment.id, reference, checkoutRequestId: stkRes.data.CheckoutRequestID });
  } catch (error) {
    console.error('M-Pesa error:', error?.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Payment initiation failed' });
  }
};

const completPayment = async (paymentId, mpesaReceipt) => {
  const pay = await query('SELECT * FROM payments WHERE id=$1', [paymentId]);
  if (!pay.rows.length) return;
  const payment = pay.rows[0];
  if (payment.status === 'completed') return;

  await query('UPDATE payments SET status=$1, mpesa_receipt=$2, updated_at=NOW() WHERE id=$3', ['completed', mpesaReceipt, paymentId]);

  const pkg = await query('SELECT * FROM packages WHERE id=$1', [payment.package_id]);
  if (!pkg.rows.length) return;
  const pack = pkg.rows[0];

  const code = generateVoucherCode();

  await query(`
    INSERT INTO vouchers (tenant_id, package_id, payment_id, code, status, phone_number)
    VALUES ($1,$2,$3,$4,'unused',$5)
  `, [payment.tenant_id, payment.package_id, payment.id, code, payment.phone_number]);

  // Send SMS with voucher code
  if (payment.phone_number) {
    try {
      const tenant = await query('SELECT name FROM tenants WHERE id=$1', [payment.tenant_id]);
      const tenantName = tenant.rows[0]?.name || 'WiFi Hotspot';
      await sendVoucherSms(payment.phone_number, code, pack.name, tenantName);
    } catch (smsErr) {
      console.error('SMS send error:', smsErr.message);
    }
  }

  return code;
};

const mpesaCallback = async (req, res) => {
  try {
    const { Body } = req.body;
    const stk = Body?.stkCallback;
    
    if (stk?.ResultCode === 0) {
      const items = stk.CallbackMetadata?.Item || [];
      const receipt = items.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
      const ref = stk.AccountReference;
      
      const pay = await query('SELECT id FROM payments WHERE reference=$1', [ref]);
      if (pay.rows.length) {
        await completPayment(pay.rows[0].id, receipt);
      }
    }
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error) {
    res.json({ ResultCode: 0, ResultDesc: 'Acknowledged' });
  }
};

const checkPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const result = await query(`
      SELECT p.*, v.code as voucher_code, v.id as voucher_id,
             pk.name as package_name, pk.duration_minutes
      FROM payments p
      LEFT JOIN vouchers v ON v.payment_id = p.id
      LEFT JOIN packages pk ON pk.id = p.package_id
      WHERE p.id = $1
    `, [paymentId]);
    
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Payment not found' });
    const pay = result.rows[0];
    
    res.json({
      success: true,
      data: {
        id: pay.id,
        status: pay.status,
        amount: pay.amount,
        method: pay.method,
        reference: pay.reference,
        packageName: pay.package_name,
        voucherCode: pay.voucher_code,
        voucherId: pay.voucher_id,
        createdAt: pay.created_at,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPayments = async (req, res) => {
  try {
    const tenantId = req.user.role === 'superadmin' ? req.query.tenantId : req.user.tenant_id;
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    
    let conditions = tenantId ? ['p.tenant_id = $1'] : [];
    let params = tenantId ? [tenantId] : [];
    let idx = params.length + 1;

    if (status) { conditions.push(`p.status = $${idx++}`); params.push(status); }
    if (startDate) { conditions.push(`p.created_at >= $${idx++}`); params.push(startDate); }
    if (endDate) { conditions.push(`p.created_at <= $${idx++}`); params.push(endDate); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const countRes = await query(`SELECT COUNT(*) FROM payments p ${where}`, params);
    params.push(limit, offset);

    const result = await query(`
      SELECT p.*, pk.name as package_name, t.name as tenant_name, v.code as voucher_code
      FROM payments p
      LEFT JOIN packages pk ON pk.id = p.package_id
      LEFT JOIN tenants t ON t.id = p.tenant_id
      LEFT JOIN vouchers v ON v.payment_id = p.id
      ${where} ORDER BY p.created_at DESC LIMIT $${idx++} OFFSET $${idx++}
    `, params);

    res.json({
      success: true, data: result.rows,
      pagination: { total: parseInt(countRes.rows[0].count), page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /api/payments/manual
 * Customer submits a manual payment reference (Paybill/Till/Airtel).
 * Creates a pending payment and immediately generates a provisional voucher.
 * Admin can revoke if payment is not confirmed.
 */
const submitManualPayment = async (req, res) => {
  try {
    const { packageId, phoneNumber, tenantSlug, method, reference } = req.body;
    if (!packageId || !phoneNumber || !method || !reference) {
      return res.status(400).json({ success: false, message: 'Package, phone, method and reference required' });
    }

    let tenantId;
    const t = await query('SELECT id FROM tenants WHERE slug=$1 AND status=$2', [tenantSlug, 'active']);
    if (!t.rows.length) return res.status(404).json({ success: false, message: 'Provider not found' });
    tenantId = t.rows[0].id;

    const pkg = await query('SELECT * FROM packages WHERE id=$1 AND tenant_id=$2 AND status=$3', [packageId, tenantId, 'active']);
    if (!pkg.rows.length) return res.status(404).json({ success: false, message: 'Package not found' });
    const pack = pkg.rows[0];

    let phone = phoneNumber.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    if (!phone.startsWith('254')) phone = '254' + phone;

    // Check reference not already used
    const existing = await query('SELECT id FROM payments WHERE reference=$1', [reference.trim().toUpperCase()]);
    if (existing.rows.length) {
      return res.status(409).json({ success: false, message: 'This reference has already been used' });
    }

    // Create payment record — pending, needs admin confirmation
    const paymentRes = await query(`
      INSERT INTO payments (tenant_id, package_id, amount, method, reference, phone_number, status, metadata)
      VALUES ($1,$2,$3,$4,$5,$6,'pending',$7) RETURNING *
    `, [tenantId, pack.id, pack.price, method, reference.trim().toUpperCase(), phone, JSON.stringify({ manualEntry: true })]);

    const payment = paymentRes.rows[0];

    // Generate provisional voucher immediately so customer isn't waiting
    const code = generateVoucherCode();
    await query(`
      INSERT INTO vouchers (tenant_id, package_id, payment_id, code, status, phone_number)
      VALUES ($1,$2,$3,$4,'unused',$5)
    `, [tenantId, pack.id, payment.id, code, phone]);

    // Send SMS
    try {
      const tenant = await query('SELECT name FROM tenants WHERE id=$1', [tenantId]);
      const tenantName = tenant.rows[0]?.name || 'WiFi Hotspot';
      await sendVoucherSms(phone, code, pack.name, tenantName);
    } catch (smsErr) {
      console.error('SMS error:', smsErr.message);
    }

    res.json({
      success: true,
      message: 'Payment recorded. Your voucher code has been sent via SMS.',
      paymentId: payment.id,
      voucherCode: code,
      packageName: pack.name,
      durationMinutes: pack.duration_minutes,
      amount: pack.price,
    });
  } catch (error) {
    console.error('Manual payment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /api/payments/:id/confirm  (admin only)
 * Marks a manual payment as completed.
 */
const confirmManualPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;
    const result = await query(
      `UPDATE payments SET status='completed', updated_at=NOW()
       WHERE id=$1 AND tenant_id=$2 AND status='pending' RETURNING *`,
      [id, tenantId]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Payment not found or already processed' });
    res.json({ success: true, message: 'Payment confirmed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { initiateMpesaSTK, mpesaCallback, checkPaymentStatus, getPayments, submitManualPayment, confirmManualPayment };
