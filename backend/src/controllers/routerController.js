const { query } = require('../utils/db');
const { testConnection } = require('../services/mikrotikService');

const getRouters = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const result = await query(
      `SELECT id, name, ip_address, type, nas_identifier, port, status, last_seen,
              api_username, use_api, created_at, updated_at
       FROM routers WHERE tenant_id=$1 ORDER BY created_at DESC`,
      [tenantId]
    );
    // Never return api_password
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createRouter = async (req, res) => {
  try {
    const { name, ipAddress, type, nasIdentifier, secret, port, apiUsername, apiPassword, useApi } = req.body;
    const tenantId = req.user.tenant_id;
    if (!name || !ipAddress || !type) return res.status(400).json({ success: false, message: 'Name, IP and type required' });

    const result = await query(`
      INSERT INTO routers (tenant_id, name, ip_address, type, nas_identifier, secret, port, api_username, api_password, use_api)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, name, ip_address, type, nas_identifier, port, status, api_username, use_api
    `, [tenantId, name, ipAddress, type, nasIdentifier, secret, port || 1812, apiUsername, apiPassword, useApi || false]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateRouter = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, ipAddress, type, nasIdentifier, secret, port, status, apiUsername, apiPassword, useApi } = req.body;
    const tenantId = req.user.tenant_id;

    // Only update api_password if a new one is provided (not a masked placeholder)
    const apiPassUpdate = apiPassword && !apiPassword.startsWith('••••') ? apiPassword : undefined;

    const result = await query(`
      UPDATE routers SET
        name=COALESCE($1,name), ip_address=COALESCE($2,ip_address), type=COALESCE($3,type),
        nas_identifier=COALESCE($4,nas_identifier), secret=COALESCE($5,secret), port=COALESCE($6,port),
        status=COALESCE($7,status), api_username=COALESCE($8,api_username),
        api_password=COALESCE($9,api_password), use_api=COALESCE($10,use_api),
        updated_at=NOW()
      WHERE id=$11 AND tenant_id=$12
      RETURNING id, name, ip_address, type, nas_identifier, port, status, api_username, use_api
    `, [name, ipAddress, type, nasIdentifier, secret, port, status, apiUsername, apiPassUpdate, useApi, id, tenantId]);

    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Router not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteRouter = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;
    const result = await query('DELETE FROM routers WHERE id=$1 AND tenant_id=$2 RETURNING id', [id, tenantId]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Router not found' });
    res.json({ success: true, message: 'Router deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /api/routers/:id/test
 * Tests connectivity to a MikroTik router via REST API
 */
const testRouter = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;

    const result = await query(
      'SELECT * FROM routers WHERE id=$1 AND tenant_id=$2',
      [id, tenantId]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Router not found' });

    const router = result.rows[0];

    if (router.type !== 'MikroTik' || !router.use_api) {
      return res.json({
        success: true,
        message: 'RADIUS mode — configure your router to authenticate against this server. No direct API test available.',
        mode: 'radius',
      });
    }

    const testResult = await testConnection(router);

    // Update last_seen if successful
    if (testResult.success) {
      await query('UPDATE routers SET last_seen=NOW() WHERE id=$1', [id]);
    }

    res.json(testResult);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getRouters, createRouter, updateRouter, deleteRouter, testRouter };
