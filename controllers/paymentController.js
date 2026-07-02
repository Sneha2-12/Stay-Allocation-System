const crypto = require('crypto');
const Payment = require('../models/Payment');
const Allocation = require('../models/Allocation');
const Room = require('../models/Room');
const User = require('../models/User');
const { generateReceiptPDF } = require('../utils/pdfGenerator');

// Lazy-initialize Razorpay to avoid crash if keys are missing during startup
let razorpayInstance = null;
function getRazorpay() {
  if (!razorpayInstance) {
    const Razorpay = require('razorpay');
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

// @desc    Create a Razorpay order for an approved booking
// @route   POST /api/payments/create-order
// @access  Private (Guest only)
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { allocationId } = req.body;

    if (!allocationId) {
      return res.status(400).json({ success: false, error: 'Please provide a booking ID' });
    }

    // Fetch booking
    const booking = await Allocation.findById(allocationId).populate('room');
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Verify ownership
    if (booking.student.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    // Ensure status is approved
    if (booking.status !== 'approved') {
      return res.status(400).json({ success: false, error: 'Booking must be approved before payment' });
    }

    // Check if already paid
    const existingPayment = await Payment.findOne({ allocation: allocationId, status: 'completed' });
    if (existingPayment) {
      return res.status(400).json({ success: false, error: 'This booking has already been paid' });
    }

    // Create Razorpay order
    const razorpay = getRazorpay();
    const amountInSmallestUnit = Math.round(booking.totalPrice * 100); // Convert to paise/cents

    const order = await razorpay.orders.create({
      amount: amountInSmallestUnit,
      currency: 'USD',
      receipt: `booking_${booking._id}`,
      notes: {
        allocationId: booking._id.toString(),
        guestEmail: req.user.email,
        roomNumber: booking.room.roomNumber,
      },
    });

    res.status(200).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      key: process.env.RAZORPAY_KEY_ID, // Frontend needs this to open checkout
      booking: {
        id: booking._id,
        totalPrice: booking.totalPrice,
        roomNumber: booking.room.roomNumber,
        guestName: req.user.name,
        guestEmail: req.user.email,
      },
    });
  } catch (err) {
    console.error('Razorpay Order Error:', err);
    if (err.error && err.error.description) {
      return res.status(400).json({ success: false, error: `Razorpay: ${err.error.description}` });
    }
    next(err);
  }
};

// @desc    Verify Razorpay payment signature and confirm reservation
// @route   POST /api/payments/verify
// @access  Private (Guest only)
exports.verifyRazorpayPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      allocationId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !allocationId) {
      return res.status(400).json({ success: false, error: 'Missing payment verification data' });
    }

    // Verify signature using HMAC SHA256
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Payment verification failed — invalid signature' });
    }

    // Signature is valid — payment is authentic
    const booking = await Allocation.findById(allocationId).populate('room');
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Check if already paid
    const existingPayment = await Payment.findOne({ allocation: allocationId, status: 'completed' });
    if (existingPayment) {
      return res.status(400).json({ success: false, error: 'This booking has already been paid' });
    }

    // Create payment record
    const payment = await Payment.create({
      student: req.user.id,
      room: booking.room._id,
      allocation: allocationId,
      amount: booking.totalPrice,
      currency: 'USD',
      transactionId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentMethod: 'card', // Razorpay handles method detection internally
      status: 'completed',
      paidAt: Date.now(),
    });

    // NOW allocate the room (only after verified payment)
    const room = await Room.findById(booking.room._id);
    if (room) {
      room.occupied += 1;
      await room.save();
    }

    const guest = await User.findById(req.user.id);
    if (guest) {
      guest.allocatedRoom = booking.room._id;
      guest.loyaltyPoints = (guest.loyaltyPoints || 0) + 500; // Award loyalty points
      await guest.save();
    }

    // Update booking status to confirmed
    booking.status = 'confirmed';
    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Payment verified and reservation confirmed! You earned 500 Loyalty Points!',
      data: payment,
    });
  } catch (err) {
    console.error('Payment Verification Error:', err);
    next(err);
  }
};

// @desc    Pay on Site — reserve room without online payment
// @route   POST /api/payments/pay-on-site
// @access  Private (Guest only)
exports.createPayOnSite = async (req, res, next) => {
  try {
    const { allocationId } = req.body;

    if (!allocationId) {
      return res.status(400).json({ success: false, error: 'Please provide a booking ID' });
    }

    const booking = await Allocation.findById(allocationId).populate('room');
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (booking.student.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    if (booking.status !== 'approved') {
      return res.status(400).json({ success: false, error: 'Booking must be approved first' });
    }

    const existingPayment = await Payment.findOne({ allocation: allocationId, status: 'completed' });
    if (existingPayment) {
      return res.status(400).json({ success: false, error: 'Already paid' });
    }

    const transactionId = 'site_' + Math.random().toString(36).substring(2, 15);

    const payment = await Payment.create({
      student: req.user.id,
      room: booking.room._id,
      allocation: allocationId,
      amount: booking.totalPrice,
      currency: 'USD',
      transactionId,
      paymentMethod: 'pay_on_site',
      status: 'completed',
      paidAt: Date.now(),
    });

    // Allocate room for pay-on-site too
    const room = await Room.findById(booking.room._id);
    if (room) {
      room.occupied += 1;
      await room.save();
    }

    const guest = await User.findById(req.user.id);
    if (guest) {
      guest.allocatedRoom = booking.room._id;
      guest.loyaltyPoints = (guest.loyaltyPoints || 0) + 500;
      await guest.save();
    }

    // Update booking status to confirmed
    booking.status = 'confirmed';
    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Room reserved! Pay at front desk upon arrival. 500 Loyalty Points credited!',
      data: payment,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all payments (Manager gets all, Guest gets their own)
// @route   GET /api/payments
// @access  Private
exports.getPayments = async (req, res, next) => {
  try {
    let query;

    if (req.user.role === 'manager') {
      query = Payment.find()
        .populate('student', 'name email')
        .populate('room')
        .populate('allocation');
    } else {
      query = Payment.find({ student: req.user.id })
        .populate('student', 'name email')
        .populate('room')
        .populate('allocation');
    }

    const payments = await query.sort('-paidAt');

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Download PDF Receipt
// @route   GET /api/payments/:id/receipt
// @access  Private
exports.downloadReceipt = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('student', 'name email')
      .populate('room')
      .populate('allocation');

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment record not found' });
    }

    if (req.user.role !== 'manager' && payment.student._id.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to access this receipt' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ success: false, error: 'Receipts only available for completed payments' });
    }

    res.setHeader('Content-Disposition', `attachment; filename=Receipt_${payment.transactionId}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');

    generateReceiptPDF(payment, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get Manager Analytics
// @route   GET /api/payments/analytics
// @access  Private (Manager only)
exports.getWardenAnalytics = async (req, res, next) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ success: false, error: 'Access denied. Managers only.' });
    }

    const totalRooms = await Room.countDocuments();
    const rooms = await Room.find();
    
    let totalCapacity = 0;
    let totalOccupied = 0;
    
    rooms.forEach(room => {
      totalCapacity += room.capacity;
      totalOccupied += room.occupied;
    });

    const pendingAllocations = await Allocation.countDocuments({ status: 'pending' });
    
    const payments = await Payment.find({ status: 'completed' });
    const totalEarnings = payments.reduce((acc, curr) => acc + curr.amount, 0);

    const wingBreakdown = {};
    rooms.forEach(room => {
      if (!wingBreakdown[room.resortWing]) {
        wingBreakdown[room.resortWing] = { total: 0, occupied: 0 };
      }
      wingBreakdown[room.resortWing].total += room.capacity;
      wingBreakdown[room.resortWing].occupied += room.occupied;
    });

    const bookings = await Allocation.find({ status: 'confirmed' });
    const stayTypeBreakdown = { solo: 0, couple: 0, family: 0, business: 0 };
    bookings.forEach(b => {
      if (stayTypeBreakdown[b.stayType] !== undefined) {
        stayTypeBreakdown[b.stayType]++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalRooms,
        totalCapacity,
        totalOccupied,
        pendingAllocations,
        totalEarnings,
        wingBreakdown,
        stayTypeBreakdown
      }
    });
  } catch (err) {
    next(err);
  }
};
