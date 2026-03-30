const axios = require('axios');

/**
 * MikroTik REST API service (RouterOS 7.x)
 * For RouterOS 6.x, use RADIUS CoA disconnect or the winbox API on port 8728
 */

const mkClient = (router) => {
  const base = `http://${router.ip_address}:${router.port && router.port !== 1812 ? router.port : 80}`;
  const auth = {
    username: router.api_username || 'admin',
    password: router.api_password || '',
  };
  return { base, auth };
};

/**
 * Test connection to a MikroTik router via REST API
 */
const testConnection = async (router) => {
  const { base, auth } = mkClient(router);
  try {
    const res = await axios.get(`${base}/rest/system/identity`, {
      auth,
      timeout: 5000,
      validateStatus: s => s < 500,
    });
    if (res.status === 401) return { success: false, message: 'Authentication failed — check API username/password' };
    if (res.status === 200) return { success: true, message: `Connected: ${res.data?.name || 'MikroTik'}` };
    return { success: false, message: `HTTP ${res.status}` };
  } catch (err) {
    if (err.code === 'ECONNREFUSED') return { success: false, message: 'Connection refused — router unreachable or REST API not enabled' };
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') return { success: false, message: 'Timeout — router not responding' };
    return { success: false, message: err.message };
  }
};

/**
 * Get active hotspot sessions for a specific username (voucher code)
 */
const getActiveSession = async (router, username) => {
  const { base, auth } = mkClient(router);
  try {
    const res = await axios.get(`${base}/rest/ip/hotspot/active`, {
      auth,
      timeout: 5000,
      params: { '=user': username },
    });
    return res.data || [];
  } catch {
    return [];
  }
};

/**
 * Disconnect a hotspot user by voucher code (username)
 */
const disconnectUser = async (router, username) => {
  const { base, auth } = mkClient(router);
  try {
    // Get active sessions for this user
    const sessions = await getActiveSession(router, username);
    if (!sessions.length) return { success: true, message: 'No active session found' };

    // Remove each session
    for (const session of sessions) {
      await axios.post(
        `${base}/rest/ip/hotspot/active/remove`,
        { '.id': session['.id'] },
        { auth, timeout: 5000 }
      );
    }
    return { success: true, message: `Disconnected ${sessions.length} session(s)` };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

module.exports = { testConnection, disconnectUser, getActiveSession };
