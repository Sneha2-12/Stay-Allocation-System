const Allocation = require('../models/Allocation');
const Room = require('../models/Room');
const User = require('../models/User');

// @desc    Create stay booking request
// @route   POST /api/allocations
// @access  Private (Guest only)
exports.createAllocationRequest = async (req, res, next) => {
  try {
    const { roomId, stayType, guestsCount, extraBedding, addOns, nights, notes } = req.body;

    // Check if user is guest
    if (req.user.role !== 'guest') {
      return res.status(403).json({ success: false, error: 'Only guests can request stay bookings' });
    }

    // Check if guest already has a stay allocated
    if (req.user.allocatedRoom) {
      return res.status(400).json({ success: false, error: 'You already have an active stay allocated' });
    }

    // Check if guest already has a pending booking request
    const pendingBooking = await Allocation.findOne({
      student: req.user.id,
      status: 'pending'
    });

    if (pendingBooking) {
      return res.status(400).json({ success: false, error: 'You already have a pending stay booking request' });
    }

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Stay/Suite not found' });
    }

    // Check capacity (number of guests cannot exceed room capacity)
    if (Number(guestsCount) > room.capacity) {
      return res.status(400).json({ 
        success: false, 
        error: `Selected guest count (${guestsCount}) exceeds maximum capacity (${room.capacity}) for this room.` 
      });
    }

    // Double check if room is already occupied
    if (room.occupied >= room.capacity) {
      return res.status(400).json({ success: false, error: 'This suite is currently fully occupied' });
    }

    // Calculate Total Price
    const stayNights = Number(nights) || 1;
    let totalPrice = room.price * stayNights;

    if (extraBedding) {
      totalPrice += 30 * stayNights; // $30/night for extra bedding
    }
    if (addOns && addOns.includes('breakfast')) {
      totalPrice += 20 * Number(guestsCount) * stayNights; // $20/guest/night
    }
    if (addOns && addOns.includes('shuttle')) {
      totalPrice += 40; // $40 flat fee
    }
    if (addOns && addOns.includes('lateCheckout')) {
      totalPrice += 30; // $30 flat fee
    }

    // Create booking
    const booking = await Allocation.create({
      student: req.user.id,
      room: roomId,
      status: 'pending',
      stayType,
      guestsCount: Number(guestsCount),
      extraBedding: Boolean(extraBedding),
      addOns: addOns || [],
      nights: stayNights,
      totalPrice,
      notes
    });

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all bookings (Manager gets all, Guest gets their own)
// @route   GET /api/allocations
// @access  Private
exports.getAllocations = async (req, res, next) => {
  try {
    let query;

    if (req.user.role === 'manager') {
      query = Allocation.find()
        .populate('student', 'name email preferences')
        .populate('room');
    } else {
      query = Allocation.find({ student: req.user.id })
        .populate('student', 'name email')
        .populate('room');
    }

    const bookings = await query.sort('-requestDate');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update booking status (Approve/Reject)
// @route   PUT /api/allocations/:id
// @access  Private (Manager only)
exports.updateAllocationStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body; // status: 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be approved or rejected' });
    }

    let booking = await Allocation.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking request not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Booking request has already been ${booking.status}` });
    }

    const room = await Room.findById(booking.room);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Stay associated with this request not found' });
    }

    const guest = await User.findById(booking.student);
    if (!guest) {
      return res.status(404).json({ success: false, error: 'Guest associated with this request not found' });
    }

    if (status === 'approved') {
      // Double check room capacity/occupancy
      if (room.occupied >= room.capacity) {
        return res.status(400).json({ success: false, error: 'Cannot approve booking. Stay/Suite is now fully occupied.' });
      }

      // Check if guest was already allocated another stay in the meantime
      if (guest.allocatedRoom) {
        booking.status = 'rejected';
        booking.notes = 'System auto-rejection: Guest has already been allocated another stay.';
        booking.actionDate = Date.now();
        await booking.save();
        return res.status(400).json({ success: false, error: 'Guest already has an active stay allocation' });
      }

      // Update room occupancy
      room.occupied += 1;
      await room.save();

      // Update guest allocated room
      guest.allocatedRoom = room._id;
      await guest.save();
    }

    // Update booking status
    booking.status = status;
    booking.notes = notes || '';
    booking.actionDate = Date.now();
    await booking.save();

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel booking request
// @route   DELETE /api/allocations/:id
// @access  Private (Guest only)
exports.cancelAllocationRequest = async (req, res, next) => {
  try {
    const booking = await Allocation.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking request not found' });
    }

    // Ensure guest owns the request
    if (booking.student.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to cancel this request' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Cannot cancel a booking that is already ${booking.status}` });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (err) {
    next(err);
  }
};
