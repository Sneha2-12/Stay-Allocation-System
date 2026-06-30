const express = require('express');
const router = express.Router();
const {
  createPayment,
  getPayments,
  downloadReceipt,
  getWardenAnalytics,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect); // Protect all payment routes

router.get('/analytics', authorize('warden'), getWardenAnalytics);

router.route('/')
  .post(createPayment)
  .get(getPayments);

router.get('/:id/receipt', downloadReceipt);

module.exports = router;
