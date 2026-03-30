const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { initiateMpesaSTK, mpesaCallback, checkPaymentStatus, getPayments } = require('../controllers/paymentController');

router.post('/mpesa/stk', initiateMpesaSTK);
router.post('/mpesa/callback', mpesaCallback);
router.get('/status/:paymentId', checkPaymentStatus);
router.get('/', authenticate, getPayments);

module.exports = router;
