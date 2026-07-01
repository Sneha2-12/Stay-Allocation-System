const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, updatePreferences, redeemPoints } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.put('/preferences', protect, updatePreferences);
router.post('/redeem', protect, redeemPoints);

module.exports = router;
