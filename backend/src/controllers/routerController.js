const { query } = require('../utils/db');

const getRouters = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const result = await query('SELECT * FROM routers WHERE tenant_id=$1 ORDER BY created_at DESC', [tenantId]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createRouter = async (req, res) => {
  try {
    const { name, ipAddress, type, nasIdentifier, secret, port } = req.body;
    const tenantId = req.user.tenant_id;
    if (!name || !ipAddress || !type) return res.status(400).json({ success: false, message: 'Name, IP and type required' });

    const result = await query(`
      INSERT INTO routers (tenant_id, name, ip_address, type, nas_identifier, secret, port)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [tenantId, name, ipAddress, type, nasIdentifier, secret, port || 1812]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateRouter = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, ipAddress, type, nasIdentifier, secret, port, status } = req.body;
    const tenantId = req.user.tenant_id;

    const result = await query(`
      UPDATE routers SET name=COALESCE($1,name), ip_address=COALESCE($2,ip_address), type=COALESCE($3,type),
        nas_identifier=COALESCE($4,nas_identifier), secret=COALESCE($5,secret), port=COALESCE($6,port),
        status=COALESCE($7,status), updated_at=NOW()
      WHERE id=$8 AND tenant_id=$9 RETURNING *
    `, [name, ipAddress, type, nasIdentifier, secret, port, status, id, tenantId]);

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

module.exports = { getRouters, createRouter, updateRouter, deleteRouter };
