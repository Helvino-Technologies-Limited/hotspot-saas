const axios = require('axios');

/**
 * Send SMS via Africa's Talking API
 * Falls back to console log if credentials not configured
 */
const sendSms = async (to, message) => {
  const apiKey = process.env.AT_API_KEY;
  const username = process.env.AT_USERNAME || 'sandbox';

  if (!apiKey || apiKey === 'your_africastalking_api_key') {
    console.log(`[SMS MOCK] To: ${to} | Message: ${message}`);
    return { success: true, mock: true };
  }

  // Normalize phone to international format
  let phone = to.replace(/\D/g, '');
  if (phone.startsWith('0')) phone = '254' + phone.slice(1);
  if (!phone.startsWith('+')) phone = '+' + phone;

  const isSandbox = username === 'sandbox';
  const url = isSandbox
    ? 'https://api.sandbox.africastalking.com/version1/messaging'
    : 'https://api.africastalking.com/version1/messaging';

  try {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('to', phone);
    params.append('message', message);
    if (process.env.AT_SENDER_ID && !isSandbox) {
      params.append('from', process.env.AT_SENDER_ID);
    }

    const res = await axios.post(url, params.toString(), {
      headers: {
        apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 10000,
    });

    const recipient = res.data?.SMSMessageData?.Recipients?.[0];
    if (recipient?.statusCode === 101) {
      return { success: true, messageId: recipient.messageId };
    }
    return { success: false, message: recipient?.status || 'Unknown error' };
  } catch (err) {
    console.error('SMS error:', err.message);
    return { success: false, message: err.message };
  }
};

/**
 * Send voucher code to customer after payment
 */
const sendVoucherSms = async (phone, code, packageName, tenantName) => {
  const message =
    `${tenantName} WiFi Access\n` +
    `Your code: ${code}\n` +
    `Package: ${packageName}\n` +
    `Use this code as your WiFi password.\n` +
    `Valid on ONE device only. Do not share.`;
  return sendSms(phone, message);
};

module.exports = { sendSms, sendVoucherSms };
