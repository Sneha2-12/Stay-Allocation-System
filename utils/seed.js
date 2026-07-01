const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Room = require('../models/Room');
const Allocation = require('../models/Allocation');
const Payment = require('../models/Payment');

// Load env vars
dotenv.config();

const usersData = [
  {
    name: 'Resort Manager',
    email: 'warden@stayease.com',
    password: 'password123',
    role: 'manager',
  },
  {
    name: 'Alice Vance',
    email: 'alice@stayease.com',
    password: 'password123',
    role: 'guest',
    preferences: {
      stayType: 'couple',
      guestsCount: 2,
      extraBedding: false,
      addOns: ['breakfast'],
    },
  },
  {
    name: 'Bob Smith',
    email: 'bob@stayease.com',
    password: 'password123',
    role: 'guest',
    preferences: {
      stayType: 'family',
      guestsCount: 4,
      extraBedding: true,
      addOns: ['breakfast', 'shuttle'],
    },
  },
  {
    name: 'Charlie Brown',
    email: 'charlie@stayease.com',
    password: 'password123',
    role: 'guest',
    preferences: {
      stayType: 'solo',
      guestsCount: 1,
      extraBedding: false,
      addOns: [],
    },
  },
  {
    name: 'Diana Prince',
    email: 'diana@stayease.com',
    password: 'password123',
    role: 'guest',
    preferences: {
      stayType: 'couple',
      guestsCount: 2,
      extraBedding: false,
      addOns: ['lateCheckout'],
    },
  },
  {
    name: 'Ethan Hunt',
    email: 'ethan@stayease.com',
    password: 'password123',
    role: 'guest',
    preferences: {
      stayType: 'business',
      guestsCount: 1,
      extraBedding: false,
      addOns: ['shuttle'],
    },
  },
];

const roomsData = [
  {
    roomNumber: 'Suite-101',
    resortWing: 'East Ocean Wing',
    type: 'Deluxe Suite',
    capacity: 2,
    occupied: 0,
    price: 350,
    floor: 1,
    amenities: ['King Bed', 'Ocean View', 'Private Balcony', 'Mini Bar', 'Coffee Maker', 'Jacuzzi'],
  },
  {
    roomNumber: 'Suite-102',
    resortWing: 'East Ocean Wing',
    type: 'Deluxe Suite',
    capacity: 2,
    occupied: 0,
    price: 320,
    floor: 1,
    amenities: ['King Bed', 'Garden View', 'Private Balcony', 'Mini Bar', 'Coffee Maker'],
  },
  {
    roomNumber: 'Villa-201',
    resortWing: 'West Palms Wing',
    type: 'Family Villa',
    capacity: 6,
    occupied: 0,
    price: 550,
    floor: 1,
    amenities: ['2 Queen Beds', 'Sofa Bed', 'Kitchenette', 'Private Pool', 'Patio', 'Living Area', 'Dining Table'],
  },
  {
    roomNumber: 'Cabin-202',
    resortWing: 'West Palms Wing',
    type: 'Penthouse Cabin',
    capacity: 4,
    occupied: 0,
    price: 450,
    floor: 3,
    amenities: ['King Bed', 'Twin Beds', 'Hot Tub', 'Mountain View', 'Fireplace', 'Kitchenette'],
  },
  {
    roomNumber: 'Room-301',
    resortWing: 'North Garden Wing',
    type: 'Standard Room',
    capacity: 2,
    occupied: 0,
    price: 180,
    floor: 2,
    amenities: ['Double Bed', 'Study Desk', 'High-speed Wi-Fi', 'Coffee Maker', 'Garden View'],
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/stayease');

    console.log('Clearing database...');
    await User.deleteMany();
    await Room.deleteMany();
    await Allocation.deleteMany();
    await Payment.deleteMany();

    console.log('Seeding Users...');
    const createdUsers = [];
    for (const u of usersData) {
      const user = new User(u);
      await user.save();
      createdUsers.push(user);
      console.log(`Created user: ${user.name} (${user.role})`);
    }

    console.log('Seeding Stays/Suites...');
    const createdRooms = await Room.insertMany(roomsData);
    console.log(`Created ${createdRooms.length} stays/suites.`);

    // Setup initial allocation & payment for demonstration
    // Let's allocate Suite-101 to Alice Vance
    const alice = createdUsers.find(u => u.email === 'alice@stayease.com');
    const suite101 = createdRooms.find(r => r.roomNumber === 'Suite-101');

    console.log('Seeding an approved booking & payment for Alice...');
    
    const nights = 2;
    const guestsCount = 2;
    // Alice booked a Deluxe Suite with breakfast package ($20/guest/night) and SUMMER15 discount (15% off)
    let subtotal = suite101.price * nights; // $700
    subtotal += 20 * guestsCount * nights; // Breakfast: $80
    const discount = subtotal * 0.15; // $117
    const totalPrice = subtotal - discount; // $663

    const booking = await Allocation.create({
      student: alice._id,
      room: suite101._id,
      status: 'approved',
      stayType: 'couple',
      guestsCount,
      extraBeddingType: 'none',
      vacationPackage: 'breakfast',
      promoCode: 'SUMMER15',
      discountApplied: 15,
      addOns: [],
      nights,
      totalPrice,
      requestDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      actionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),  // 1 day ago
      notes: 'Anniversary couple getaway stay. High floor preferred.',
    });

    // Update room occupancy & guest record
    suite101.occupied = 2; 
    await suite101.save();

    alice.allocatedRoom = suite101._id;
    await alice.save();

    // Create payment
    const transactionId = 'pi_seed_transaction_luxury_001';
    await Payment.create({
      student: alice._id,
      room: suite101._id,
      allocation: booking._id,
      amount: totalPrice,
      transactionId,
      status: 'completed',
      paidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    });

    // Seed a pending booking for Bob Smith in Villa-201 (Family Villa)
    console.log('Seeding a pending family booking request for Bob...');
    const bob = createdUsers.find(u => u.email === 'bob@stayease.com');
    const villa201 = createdRooms.find(r => r.roomNumber === 'Villa-201');

    // Bob booked 3 nights for 4 guests with extra bedding (rollaway bed: $50/night), all inclusive ($80/guest/night), and shuttle ($40)
    // Applied MONSOON20 (20% off)
    const bobNights = 3;
    const bobGuests = 4;
    let bobSubtotal = villa201.price * bobNights; // $1650
    bobSubtotal += 50 * bobNights; // Rollaway Bed: $150
    bobSubtotal += 80 * bobGuests * bobNights; // All-Inclusive: $960
    bobSubtotal += 40; // Shuttle: $40
    // Subtotal = $2800
    const bobDiscount = bobSubtotal * 0.20; // $560
    const bobTotal = bobSubtotal - bobDiscount; // $2240

    await Allocation.create({
      student: bob._id,
      room: villa201._id,
      status: 'pending',
      stayType: 'family',
      guestsCount: bobGuests,
      extraBeddingType: 'rollaway_bed',
      vacationPackage: 'all_inclusive',
      promoCode: 'MONSOON20',
      discountApplied: 20,
      addOns: ['shuttle'],
      nights: bobNights,
      totalPrice: bobTotal,
      requestDate: new Date(),
      notes: 'Family vacation. Need the rollaway bed setup before check-in.',
    });

    console.log('Database Seeding Completed Successfully!');
    process.exit();
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedDB();
