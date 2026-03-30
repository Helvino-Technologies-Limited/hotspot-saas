const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getPackages, getPublicPackages, createPackage, updatePackage, deletePackage } = require('../controllers/packageController');

router.get('/public/:tenantSlug', getPublicPackages);
router.get('/', authenticate, getPackages);
router.post('/', authenticate, requireAdmin, createPackage);
router.put('/:id', authenticate, requireAdmin, updatePackage);
router.delete('/:id', authenticate, requireAdmin, deletePackage);

module.exports = router;
