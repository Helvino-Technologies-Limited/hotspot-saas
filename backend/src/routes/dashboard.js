const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/dashboardController');

router.get('/', authenticate, getDashboardStats);

module.exports = router;
