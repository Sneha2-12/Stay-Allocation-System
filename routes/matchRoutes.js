const express = require('express');
const router = express.Router();
const { getRoommateMatches } = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/roommates', getRoommateMatches);

module.exports = router;
