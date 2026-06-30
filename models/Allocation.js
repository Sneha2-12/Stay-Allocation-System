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
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
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
  extraBedding: {
    type: Boolean,
    default: false,
  },
  addOns: {
    type: [String],
    default: [], // ['breakfast', 'shuttle', 'lateCheckout']
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
  notes: {
    type: String,
    trim: true,
  },
});

module.exports = mongoose.model('Allocation', AllocationSchema);
