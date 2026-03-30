const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getSessions, terminateSession, getSessionStats } = require('../controllers/sessionController');

router.get('/', authenticate, getSessions);
router.get('/stats', authenticate, getSessionStats);
router.patch('/:id/terminate', authenticate, requireAdmin, terminateSession);

module.exports = router;
