const Room = require('../models/Room');

// @desc    Get recommended stays for the logged-in guest based on their stay preferences
// @route   GET /api/match/roommates
// @access  Private (Guest only)
exports.getRoommateMatches = async (req, res, next) => {
  try {
    const currentUser = req.user;

    if (currentUser.role !== 'guest') {
      return res.status(403).json({ success: false, error: 'Only guests can receive stay recommendations' });
    }

    const { stayType, guestsCount, extraBedding } = currentUser.preferences;

    // Fetch all rooms
    const rooms = await Room.find();

    const recommendations = rooms.map(room => {
      let score = 50; // Base score

      // 1. Capacity Compatibility Check
      // If room capacity is less than the guest count, it's incompatible (0% match)
      if (room.capacity < guestsCount) {
        return {
          room,
          matchPercentage: 0,
          reasons: ['Capacity too small']
        };
      }

      const reasons = [];

      // Ideal capacity match
      if (room.capacity === guestsCount) {
        score += 20;
        reasons.push('Perfect size for your group');
      } else if (room.capacity > guestsCount) {
        // If room is larger, it's fine but less optimal unless it's a family stay
        score += 10;
        reasons.push('Spacious accommodation');
      }

      // 2. Stay Type Alignment
      if (stayType === 'couple') {
        if (room.type === 'Deluxe Suite') {
          score += 15;
          reasons.push('Deluxe suite ideal for couples');
        }
        if (room.amenities.some(a => a.toLowerCase().includes('king bed'))) {
          score += 15;
          reasons.push('Features a comfortable King Bed');
        }
      } else if (stayType === 'family') {
        if (room.type === 'Family Villa') {
          score += 20;
          reasons.push('Spacious villa designed for families');
        }
        if (room.capacity >= 4) {
          score += 10;
          reasons.push('Accommodates family members comfortably');
        }
        if (room.amenities.some(a => a.toLowerCase().includes('kitchenette') || a.toLowerCase().includes('balcony'))) {
          score += 5;
          reasons.push('Includes family-friendly amenities');
        }
      } else if (stayType === 'solo') {
        if (room.capacity === 1) {
          score += 20;
          reasons.push('Private single occupancy room');
        }
        if (room.type === 'Standard Room') {
          score += 10;
          reasons.push('Affordable standard room option');
        }
      } else if (stayType === 'business') {
        if (room.amenities.some(a => a.toLowerCase().includes('study desk') || a.toLowerCase().includes('desk'))) {
          score += 20;
          reasons.push('Equipped with a workspace/study desk');
        }
        if (room.type === 'Standard Room' || room.type === 'Deluxe Suite') {
          score += 10;
          reasons.push('Professional, quiet environment');
        }
      }

      // 3. Occupancy check
      if (room.occupied >= room.capacity) {
        score = 0; // Fully booked
        reasons.push('Fully occupied');
      }

      const matchPercentage = Math.min(Math.round(score), 100);

      return {
        room,
        matchPercentage,
        reasons: reasons.slice(0, 3) // Return top 3 reasons
      };
    });

    // Filter out 0% matches and sort by match percentage descending
    const filteredRecommendations = recommendations
      .filter(rec => rec.matchPercentage > 0)
      .sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.status(200).json({
      success: true,
      count: filteredRecommendations.length,
      data: filteredRecommendations
    });
  } catch (err) {
    next(err);
  }
};
