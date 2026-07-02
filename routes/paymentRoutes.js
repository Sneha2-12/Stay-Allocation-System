const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createPayOnSite,
  getPayments,
  downloadReceipt,
  getWardenAnalytics,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect); // Protect all payment routes

router.get('/analytics', authorize('manager'), getWardenAnalytics);

router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyRazorpayPayment);
router.post('/pay-on-site', createPayOnSite);

router.route('/')
  .get(getPayments);

router.get('/:id/receipt', downloadReceipt);

module.exports = router;
