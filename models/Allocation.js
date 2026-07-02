const mongoose = require('mongoose');

const AllocationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'confirmed'],
    default: 'pending',
  },
  stayType: {
    type: String,
    enum: ['solo', 'couple', 'family', 'business'],
    required: true,
  },
  guestsCount: {
    type: Number,
    required: true,
    min: 1,
  },
  extraBeddingType: {
    type: String,
    enum: ['none', 'single_mattress', 'double_mattress', 'rollaway_bed'],
    default: 'none',
  },
  vacationPackage: {
    type: String,
    enum: ['room_only', 'breakfast', 'all_inclusive'],
    default: 'room_only',
  },
  promoCode: {
    type: String,
    default: '',
  },
  discountApplied: {
    type: Number, // Percentage discount, e.g. 15 for 15%
    default: 0,
  },
  nights: {
    type: Number,
    default: 1,
    min: 1,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  requestDate: {
    type: Date,
    default: Date.now,
  },
  actionDate: {
    type: Date,
  },
  addOns: {
    type: [String],
    default: [],
  },
  notes: {
    type: String,
    trim: true,
  },
});

module.exports = mongoose.model('Allocation', AllocationSchema);
