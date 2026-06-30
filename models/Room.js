const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: [true, 'Please add a room or suite number'],
    unique: true,
    trim: true,
  },
  resortWing: {
    type: String,
    required: [true, 'Please add a resort wing or block name'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['Standard Room', 'Deluxe Suite', 'Family Villa', 'Penthouse Cabin'],
    default: 'Standard Room',
  },
  capacity: {
    type: Number,
    required: [true, 'Please specify the maximum guest capacity'],
    min: [1, 'Capacity must be at least 1'],
  },
  occupied: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    required: [true, 'Please specify the price per night'],
  },
  amenities: {
    type: [String],
    default: [],
  },
  floor: {
    type: Number,
    required: [true, 'Please specify the floor number'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Room', RoomSchema);
