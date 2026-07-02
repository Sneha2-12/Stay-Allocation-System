const Payment = require('../models/Payment');
const Allocation = require('../models/Allocation');
const Room = require('../models/Room');
const User = require('../models/User');
const { generateReceiptPDF } = require('../utils/pdfGenerator');

const Razorpay = require("razorpay");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Process simulated payment for an approved stay booking
// @route   POST /api/payments
// @access  Private (Guest only)
exports.createPayment = async (req, res, next) => {
  try {
    const { allocationId, cardNumber, cardExpiry, cardCvc } = req.body;

    if (!allocationId) {
      return res.status(400).json({ success: false, error: 'Please provide a booking ID' });
    }

    if (!cardNumber) {
      return res.status(400).json({ success: false, error: 'Please provide payment details' });
    }

    // Check payment gateway method
    let transactionId = '';
    if (cardNumber === 'PAY_ON_SITE') {
      transactionId = 'site_' + Math.random().toString(36).substring(2, 15);
    } else if (cardNumber === 'UPI_PAYMENT') {
      transactionId = 'upi_' + Math.random().toString(36).substring(2, 15);
    } else if (cardNumber === 'NET_BANKING') {
      transactionId = 'nb_' + Math.random().toString(36).substring(2, 15);
    } else {
      // Basic mock card check
      if (!cardExpiry || !cardCvc) {
        return res.status(400).json({ success: false, error: 'Please provide card expiration date and CVC code' });
      }
      transactionId = 'pi_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    // Fetch booking
    const booking = await Allocation.findById(allocationId).populate('room');
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Verify ownership
    if (booking.student.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to pay for this booking' });
    }

    // Ensure status is approved
    if (booking.status !== 'approved') {
      return res.status(400).json({ success: false, error: 'Payments can only be made for approved bookings' });
    }

    // Check if payment already exists and is completed
    const existingPayment = await Payment.findOne({
      allocation: allocationId,
      status: 'completed'
    });

    if (existingPayment) {
      return res.status(400).json({ success: false, error: 'This booking has already been paid for' });
    }

    // Simulate payment processing (Stripe-like)
    const payment = await Payment.create({
      student: req.user.id,
      room: booking.room._id,
      allocation: allocationId,
      amount: booking.totalPrice, // Charge the dynamic total price including add-ons!
      transactionId,
      status: 'completed',
      paidAt: Date.now()
    });

    // AWARD LOYALTY BONUS POINTS (500 points)
    const guest = await User.findById(req.user.id);
    if (guest) {
      guest.loyaltyPoints = (guest.loyaltyPoints || 0) + 500;
      await guest.save();
    }

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully (Simulated Stripe Integration). You earned 500 Loyalty Bonus Points!',
      data: payment
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
        .populate('room');
    } else {
      query = Payment.find({ student: req.user.id })
        .populate('student', 'name email')
        .populate('room');
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

    // Verify authorization
    if (req.user.role !== 'manager' && payment.student._id.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to access this receipt' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ success: false, error: 'Receipts are only available for completed payments' });
    }

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename=Receipt_${payment.transactionId}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');

    // Generate and stream PDF
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
    
    // Calculate total earnings
    const payments = await Payment.find({ status: 'completed' });
    const totalEarnings = payments.reduce((acc, curr) => acc + curr.amount, 0);

    // Get resort wing occupancy breakdown
    const wingBreakdown = {};
    rooms.forEach(room => {
      if (!wingBreakdown[room.resortWing]) {
        wingBreakdown[room.resortWing] = { total: 0, occupied: 0 };
      }
      wingBreakdown[room.resortWing].total += room.capacity;
      wingBreakdown[room.resortWing].occupied += room.occupied;
    });

    // Get stay types breakdown for bookings
    const bookings = await Allocation.find({ status: 'approved' });
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
