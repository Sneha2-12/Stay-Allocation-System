const express = require('express');
const router = express.Router();
const {
  createAllocationRequest,
  getAllocations,
  updateAllocationStatus,
  cancelAllocationRequest,
} = require('../controllers/allocationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect); // Protect all allocation routes

router.route('/')
  .post(createAllocationRequest)
  .get(getAllocations);

router.route('/:id')
  .put(authorize('manager'), updateAllocationStatus)
  .delete(cancelAllocationRequest);

module.exports = router;
