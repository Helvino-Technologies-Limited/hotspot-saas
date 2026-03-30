const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getSettings, updateSettings, updateBranding } = require('../controllers/settingsController');

router.get('/', authenticate, getSettings);
router.put('/', authenticate, requireAdmin, updateSettings);
router.put('/branding', authenticate, requireAdmin, updateBranding);

module.exports = router;
