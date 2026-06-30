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

  // Colors
  const primaryColor = '#8b5cf6'; // Violet / Purple
  const secondaryColor = '#0f172a'; // Deep Slate / Black
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
    .text('INVOICE RECEIPT', 380, 45, { align: 'right', width: 165 })
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

  // Row 1: Room Rent
  doc
    .fillColor(textColor)
    .font('Helvetica')
    .text(`${payment.room.type} Room Rate`, 60, y)
    .text(`$${payment.room.price.toFixed(2)} x ${nights} night(s)`, 320, y)
    .text(`$${(payment.room.price * nights).toFixed(2)}`, 450, y, { align: 'right', width: 85 });
  y += 20;

  // Row 2: Extra Bedding (if applicable)
  if (booking.extraBedding) {
    doc
      .text('Extra Rollaway Bedding', 60, y)
      .text(`$30.00 x ${nights} night(s)`, 320, y)
      .text(`$${(30 * nights).toFixed(2)}`, 450, y, { align: 'right', width: 85 });
    y += 20;
  }

  // Row 3: Breakfast Add-on (if applicable)
  if (booking.addOns.includes('breakfast')) {
    const dailyBf = 20 * booking.guestsCount;
    doc
      .text('Premium Breakfast Buffet (Daily)', 60, y)
      .text(`$20.00 x ${booking.guestsCount} guest(s) x ${nights} night(s)`, 320, y)
      .text(`$${(dailyBf * nights).toFixed(2)}`, 450, y, { align: 'right', width: 85 });
    y += 20;
  }

  // Row 4: Airport Shuttle (if applicable)
  if (booking.addOns.includes('shuttle')) {
    doc
      .text('Roundtrip Airport Shuttle Transfer', 60, y)
      .text('Flat One-time Service Fee', 320, y)
      .text('$40.00', 450, y, { align: 'right', width: 85 });
    y += 20;
  }

  // Row 5: Late Checkout (if applicable)
  if (booking.addOns.includes('lateCheckout')) {
    doc
      .text('Guaranteed Late Checkout (4:00 PM)', 60, y)
      .text('Flat One-time Service Fee', 320, y)
      .text('$30.00', 450, y, { align: 'right', width: 85 });
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
