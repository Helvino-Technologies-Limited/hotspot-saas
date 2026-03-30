const router = require('express').Router();
const { authenticate, requireSuperAdmin } = require('../middleware/auth');
const {
  getAllTenants, createTenant, getTenant, updateTenant,
  toggleTenantStatus, impersonateTenant, getSuperAdminStats
} = require('../controllers/tenantController');

router.use(authenticate, requireSuperAdmin);

router.get('/stats', getSuperAdminStats);
router.get('/', getAllTenants);
router.post('/', createTenant);
router.get('/:id', getTenant);
router.put('/:id', updateTenant);
router.patch('/:id/toggle-status', toggleTenantStatus);
router.post('/:id/impersonate', impersonateTenant);

module.exports = router;
