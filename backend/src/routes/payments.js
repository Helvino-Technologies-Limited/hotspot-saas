const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  initiateMpesaSTK, mpesaCallback, checkPaymentStatus,
  getPayments, submitManualPayment, confirmManualPayment
} = require('../controllers/paymentController');

router.post('/mpesa/stk', initiateMpesaSTK);
router.post('/mpesa/callback', mpesaCallback);
router.post('/manual', submitManualPayment);
router.get('/status/:paymentId', checkPaymentStatus);
router.get('/', authenticate, getPayments);
router.patch('/:id/confirm', authenticate, requireAdmin, confirmManualPayment);

module.exports = router;
