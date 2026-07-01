const PDFDocument = require('pdfkit');

/**
 * Generates a beautiful PDF receipt for stay bookings and streams it to the response
 * @param {Object} payment - Payment model object populated with student (guest) and room
 * @param {Object} res - Express response object
 */
const generateReceiptPDF = (payment, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // Stream PDF directly to the response
  doc.pipe(res);

  // Colors - Luxurious Champagne Gold & Obsidian Deep Slate
  const primaryColor = '#d97706'; // Warm Gold
  const secondaryColor = '#062c22'; // Emerald Obsidian
  const textColor = '#334155'; // Slate Grey
  const lightGrey = '#f8fafc';

  const booking = payment.allocation;

  // --- HEADER SECTION ---
  doc
    .rect(0, 0, 595.28, 120) // Full width colored header block
    .fill(secondaryColor);

  doc
    .fillColor('#ffffff')
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('STAYEASE RESORT', 50, 40)
    .fontSize(10)
    .font('Helvetica')
    .text('Luxury Accommodations & Premium Stay Experience', 50, 70);

  doc
    .fillColor('#ffffff')
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('OFFICIAL INVOICE', 380, 45, { align: 'right', width: 165 })
    .fontSize(8)
    .font('Helvetica')
    .text(`TXN: ${payment.transactionId}`, 380, 70, { align: 'right', width: 165 });

  // Move cursor down
  doc.y = 150;

  // --- TRANSACTION INFO ---
  doc
    .fillColor(secondaryColor)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('Transaction Details', 50, 150);

  doc
    .strokeColor('#cbd5e1')
    .lineWidth(1)
    .moveTo(50, 168)
    .lineTo(545, 168)
    .stroke();

  doc
    .fillColor(textColor)
    .fontSize(9)
    .font('Helvetica')
    .text('Payment Date:', 50, 180)
    .font('Helvetica-Bold')
    .text(new Date(payment.paidAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }), 150, 180);

  doc
    .font('Helvetica')
    .text('Transaction ID:', 50, 195)
    .font('Helvetica-Bold')
    .text(payment.transactionId, 150, 195);

  doc
    .font('Helvetica')
    .text('Payment Status:', 50, 210)
    .font('Helvetica-Bold')
    .fillColor('#10b981') // Emerald green
    .text(payment.status.toUpperCase(), 150, 210);

  // --- GUEST DETAILS ---
  doc
    .fillColor(secondaryColor)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('Guest Profile', 50, 245);

  doc
    .strokeColor('#cbd5e1')
    .moveTo(50, 263)
    .lineTo(545, 263)
    .stroke();

  doc
    .fillColor(textColor)
    .fontSize(9)
    .font('Helvetica')
    .text('Guest Name:', 50, 275)
    .font('Helvetica-Bold')
    .text(payment.student.name, 150, 275);

  doc
    .font('Helvetica')
    .text('Guest Email:', 50, 290)
    .font('Helvetica-Bold')
    .text(payment.student.email, 150, 290);

  // --- STAY DETAILS ---
  doc
    .fillColor(secondaryColor)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('Reservation Details', 50, 325);

  doc
    .strokeColor('#cbd5e1')
    .moveTo(50, 343)
    .lineTo(545, 343)
    .stroke();

  doc
    .fillColor(textColor)
    .fontSize(9)
    .font('Helvetica')
    .text('Stay Room / Suite:', 50, 355)
    .font('Helvetica-Bold')
    .text(`Room ${payment.room.roomNumber} (${payment.room.type})`, 150, 355);

  doc
    .font('Helvetica')
    .text('Resort Wing:', 50, 370)
    .font('Helvetica-Bold')
    .text(payment.room.resortWing, 150, 370);

  doc
    .font('Helvetica')
    .text('Booking Config:', 50, 385)
    .font('Helvetica-Bold')
    .text(`${booking.guestsCount} Guest(s) | Stay Type: ${booking.stayType.toUpperCase()} | ${booking.nights || 1} Night(s)`, 150, 385);

  // --- ITEMIZED CHARGES ---
  doc
    .fillColor(secondaryColor)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('Itemized Invoice', 50, 425);

  // Draw Table Header
  doc
    .rect(50, 445, 495, 20)
    .fill(lightGrey);

  doc
    .fillColor(secondaryColor)
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('Description', 60, 451)
    .text('Price Breakdown', 320, 451)
    .text('Total', 450, 451, { align: 'right', width: 85 });

  // Table Body Rows
  let y = 475;
  const nights = booking.nights || 1;
  const guests = booking.guestsCount || 1;

  // 1. Suite base price
  doc
    .fillColor(textColor)
    .font('Helvetica')
    .text(`${payment.room.type} Room Charge`, 60, y)
    .text(`$${payment.room.price.toFixed(2)} x ${nights} night(s)`, 320, y)
    .text(`$${(payment.room.price * nights).toFixed(2)}`, 450, y, { align: 'right', width: 85 });
  y += 20;

  // 2. Extra Bedding/Mattress pricing
  if (booking.extraBeddingType && booking.extraBeddingType !== 'none') {
    let beddingLabel = 'Extra Mattress';
    let beddingPrice = 0;
    if (booking.extraBeddingType === 'single_mattress') {
      beddingLabel = 'Single Mattress Add-on';
      beddingPrice = 20;
    } else if (booking.extraBeddingType === 'double_mattress') {
      beddingLabel = 'Double Mattress Add-on';
      beddingPrice = 35;
    } else if (booking.extraBeddingType === 'rollaway_bed') {
      beddingLabel = 'Extra Rollaway Bed';
      beddingPrice = 50;
    }
    
    doc
      .text(beddingLabel, 60, y)
      .text(`$${beddingPrice.toFixed(2)} x ${nights} night(s)`, 320, y)
      .text(`$${(beddingPrice * nights).toFixed(2)}`, 450, y, { align: 'right', width: 85 });
    y += 20;
  }

  // 3. Vacation Package pricing
  if (booking.vacationPackage && booking.vacationPackage !== 'room_only') {
    let packageLabel = '';
    let packagePrice = 0;
    if (booking.vacationPackage === 'breakfast') {
      packageLabel = 'Premium Breakfast Buffet (Daily)';
      packagePrice = 20;
    } else if (booking.vacationPackage === 'all_inclusive') {
      packageLabel = 'All-Inclusive Resort Pass (Daily)';
      packagePrice = 80;
    }

    doc
      .text(packageLabel, 60, y)
      .text(`$${packagePrice.toFixed(2)} x ${guests} guest(s) x ${nights} night(s)`, 320, y)
      .text(`$${(packagePrice * guests * nights).toFixed(2)}`, 450, y, { align: 'right', width: 85 });
    y += 20;
  }

  // 4. Flat Add-ons (Shuttle, Late Checkout)
  if (booking.addOns.includes('shuttle')) {
    doc
      .text('Roundtrip Airport Shuttle Transfer', 60, y)
      .text('Flat One-time Service Fee', 320, y)
      .text('$40.00', 450, y, { align: 'right', width: 85 });
    y += 20;
  }

  if (booking.addOns.includes('lateCheckout')) {
    doc
      .text('Guaranteed Late Checkout (4:00 PM)', 60, y)
      .text('Flat One-time Service Fee', 320, y)
      .text('$30.00', 450, y, { align: 'right', width: 85 });
    y += 20;
  }

  // Calculate Subtotal for Discount math
  let subtotal = (payment.room.price * nights);
  let bPrice = 0;
  if (booking.extraBeddingType === 'single_mattress') bPrice = 20;
  else if (booking.extraBeddingType === 'double_mattress') bPrice = 35;
  else if (booking.extraBeddingType === 'rollaway_bed') bPrice = 50;
  subtotal += bPrice * nights;

  let pkgPrice = 0;
  if (booking.vacationPackage === 'breakfast') pkgPrice = 20;
  else if (booking.vacationPackage === 'all_inclusive') pkgPrice = 80;
  subtotal += pkgPrice * guests * nights;

  if (booking.addOns.includes('shuttle')) subtotal += 40;
  if (booking.addOns.includes('lateCheckout')) subtotal += 30;

  // 5. Promo Discount row
  if (booking.discountApplied > 0) {
    const discountVal = subtotal * (booking.discountApplied / 100);
    
    doc
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .text(`Promo Code: ${booking.promoCode} (${booking.discountApplied}% Off)`, 60, y)
      .font('Helvetica')
      .text(`Seasonal Discount Applied`, 320, y)
      .text(`-$${discountVal.toFixed(2)}`, 450, y, { align: 'right', width: 85 });
    y += 20;
  }

  doc
    .strokeColor('#cbd5e1')
    .moveTo(50, y + 5)
    .lineTo(545, y + 5)
    .stroke();

  // Grand Total
  doc
    .fillColor(secondaryColor)
    .font('Helvetica-Bold')
    .text('Grand Total Paid', 300, y + 20)
    .fontSize(14)
    .fillColor(primaryColor)
    .text(`$${payment.amount.toFixed(2)}`, 450, y + 17, { align: 'right', width: 85 });

  // --- PAID WATERMARK STAMP ---
  doc
    .save()
    .translate(430, 235)
    .rotate(15)
    .rect(-10, -5, 90, 30)
    .lineWidth(2)
    .strokeColor('#10b981')
    .stroke()
    .fillColor('#10b981')
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('PAID', 18, 5)
    .restore();

  // --- FOOTER SECTION ---
  doc
    .strokeColor('#e2e8f0')
    .moveTo(50, 750)
    .lineTo(545, 750)
    .stroke();

  doc
    .fillColor('#94a3b8')
    .fontSize(8)
    .font('Helvetica')
    .text('Thank you for choosing StayEase Resort. We look forward to welcoming you!', 50, 762, { align: 'center', width: 495 })
    .text('For reservations, modifications, or concierge requests, email hospitality@stayease.com', 50, 775, { align: 'center', width: 495 });

  // End document
  doc.end();
};

module.exports = { generateReceiptPDF };
