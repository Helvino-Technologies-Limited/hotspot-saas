const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getVouchers, generateManualVoucher, redeemVoucher, revokeVoucher, getVoucherStats } = require('../controllers/voucherController');

router.post('/redeem', redeemVoucher);
router.get('/', authenticate, getVouchers);
router.get('/stats', authenticate, getVoucherStats);
router.post('/generate', authenticate, requireAdmin, generateManualVoucher);
router.patch('/:id/revoke', authenticate, requireAdmin, revokeVoucher);

module.exports = router;
