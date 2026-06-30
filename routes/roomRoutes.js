const express = require('express');
const router = express.Router();
const { getRooms, getRoom, createRoom, updateRoom, deleteRoom } = require('../controllers/roomController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect); // Protect all room routes

router.route('/')
  .get(getRooms)
  .post(authorize('warden'), createRoom);

router.route('/:id')
  .get(getRoom)
  .put(authorize('warden'), updateRoom)
  .delete(authorize('warden'), deleteRoom);

module.exports = router;
