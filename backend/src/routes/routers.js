const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getRouters, createRouter, updateRouter, deleteRouter, testRouter } = require('../controllers/routerController');

router.get('/', authenticate, getRouters);
router.post('/', authenticate, requireAdmin, createRouter);
router.put('/:id', authenticate, requireAdmin, updateRouter);
router.delete('/:id', authenticate, requireAdmin, deleteRouter);
router.post('/:id/test', authenticate, requireAdmin, testRouter);

module.exports = router;
