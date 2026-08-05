const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const generateCertificatePDF = ({
  studentName,
  rollNumber,
  eventTitle,
  eventDate,
  organizer,
  certificateId,
  issueDate,
  qrCodeUrl,
}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margin: 40,
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Background Outer Border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
         .lineWidth(4)
         .stroke('#1E3A8A');

      // Inner Accent Border
      doc.rect(28, 28, doc.page.width - 56, doc.page.height - 56)
         .lineWidth(1.5)
         .stroke('#D97706');

      // College Logo Header
      const logoPath = path.join(__dirname, '..', 'sri_vasavi_logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, doc.page.width / 2 - 35, 42, { width: 70 });
      }

      // College Name Header
      doc.moveDown(4.5);
      doc.font('Helvetica-Bold')
         .fontSize(22)
         .fillColor('#1E3A8A')
         .text('SRI VASAVI ENGINEERING COLLEGE', { align: 'center' });

      doc.font('Helvetica')
         .fontSize(10)
         .fillColor('#4B5563')
         .text('Approved by AICTE, Permanently Affiliated to JNTUK | Accredited by NBA & NAAC with A Grade', { align: 'center' });

      // Certificate Title
      doc.moveDown(1);
      doc.font('Helvetica-Bold')
         .fontSize(26)
         .fillColor('#B45309')
         .text('CERTIFICATE OF PARTICIPATION', { align: 'center' });

      doc.moveDown(0.3);
      doc.font('Helvetica')
         .fontSize(12)
         .fillColor('#6B7280')
         .text('THIS IS PROUDLY PRESENTED TO', { align: 'center' });

      // Student Name & Roll Number
      doc.moveDown(0.6);
      doc.font('Helvetica-Bold')
         .fontSize(24)
         .fillColor('#111827')
         .text(studentName.toUpperCase(), { align: 'center' });

      if (rollNumber) {
        doc.font('Helvetica-Bold')
           .fontSize(11)
           .fillColor('#2563EB')
           .text(`(Roll No: ${rollNumber})`, { align: 'center' });
      }

      doc.moveDown(0.5);
      doc.font('Helvetica')
         .fontSize(12)
         .fillColor('#374151')
         .text(`For active participation and successful completion of the campus event:`, { align: 'center' });

      // Event Title
      doc.moveDown(0.4);
      doc.font('Helvetica-Bold')
         .fontSize(18)
         .fillColor('#1E3A8A')
         .text(`"${eventTitle}"`, { align: 'center' });

      const dateStr = eventDate ? new Date(eventDate).toLocaleDateString() : new Date(issueDate).toLocaleDateString();
      doc.moveDown(0.3);
      doc.font('Helvetica')
         .fontSize(11)
         .fillColor('#6B7280')
         .text(`Organized by ${organizer || 'College Event Committee'} on ${dateStr}`, { align: 'center' });

      // Footer Section with QR, Metadata, & Digital Signatures
      const footerY = doc.page.height - 125;

      // Left: Metadata & Verification
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#4B5563')
         .text(`Certificate ID: ${certificateId}`, 55, footerY);

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#6B7280')
         .text(`Issue Date: ${new Date(issueDate).toLocaleDateString()}`, 55, footerY + 14);

      doc.fontSize(8)
         .fillColor('#059669')
         .text(`✓ Verified Official Document`, 55, footerY + 28);

      // Center-Right: QR Code Verification
      if (qrCodeUrl && qrCodeUrl.startsWith('data:image')) {
        const base64Data = qrCodeUrl.replace(/^data:image\/\w+;base64,/, '');
        const qrBuffer = Buffer.from(base64Data, 'base64');
        doc.image(qrBuffer, doc.page.width / 2 + 100, footerY - 15, { width: 75 });
      }

      // Right: Digital Signature Placeholder
      const sigX = doc.page.width - 185;
      doc.lineWidth(1)
         .strokeColor('#9CA3AF')
         .moveTo(sigX, footerY + 30)
         .lineTo(sigX + 130, footerY + 30)
         .stroke();

      doc.font('Helvetica-Bold')
         .fontSize(10)
         .fillColor('#111827')
         .text('Principal / Coordinator', sigX, footerY + 35, { width: 130, align: 'center' });

      doc.font('Helvetica-Oblique')
         .fontSize(8)
         .fillColor('#6B7280')
         .text('Sri Vasavi Engg. College', sigX, footerY + 47, { width: 130, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

const generateReceiptPDF = ({
  studentName,
  eventTitle,
  registrationFee,
  transactionId,
  paymentMethod,
  invoiceNumber,
  paidAt,
}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Background Outer Border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
         .lineWidth(2)
         .stroke('#1E3A8A');

      // College Logo Header
      const logoPath = path.join(__dirname, '..', 'sri_vasavi_logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, doc.page.width / 2 - 25, 40, { width: 50 });
      }

      // College Name Header
      doc.moveDown(3);
      doc.font('Helvetica-Bold')
         .fontSize(16)
         .fillColor('#1E3A8A')
         .text('SRI VASAVI ENGINEERING COLLEGE', { align: 'center' });

      doc.font('Helvetica')
         .fontSize(8)
         .fillColor('#4B5563')
         .text('Pedatadepalli, Tadepalligudem, Andhra Pradesh 534101', { align: 'center' });

      doc.moveDown(1.5);
      doc.font('Helvetica-Bold')
         .fontSize(14)
         .fillColor('#B45309')
         .text('OFFICIAL PAYMENT RECEIPT / INVOICE', { align: 'center' });

      doc.moveDown(1);

      // Draw a line
      doc.lineWidth(1)
         .strokeColor('#E5E7EB')
         .moveTo(40, doc.y)
         .lineTo(doc.page.width - 40, doc.y)
         .stroke();

      doc.moveDown(1.5);

      // Details
      const startX = 60;
      let currentY = doc.y;

      doc.font('Helvetica-Bold').fontSize(10).fillColor('#4B5563').text('Invoice Number:', startX, currentY);
      doc.font('Helvetica').fontSize(10).fillColor('#111827').text(invoiceNumber || `INV-${Date.now()}`, startX + 130, currentY);

      currentY += 22;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#4B5563').text('Date & Time:', startX, currentY);
      doc.font('Helvetica').fontSize(10).fillColor('#111827').text(paidAt ? new Date(paidAt).toLocaleString() : new Date().toLocaleString(), startX + 130, currentY);

      currentY += 22;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#4B5563').text('Student Name:', startX, currentY);
      doc.font('Helvetica').fontSize(10).fillColor('#111827').text(studentName, startX + 130, currentY);

      currentY += 22;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#4B5563').text('Event Name:', startX, currentY);
      doc.font('Helvetica').fontSize(10).fillColor('#111827').text(eventTitle, startX + 130, currentY);

      currentY += 22;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#4B5563').text('Transaction ID:', startX, currentY);
      doc.font('Helvetica').fontSize(10).fillColor('#111827').text(transactionId || 'N/A', startX + 130, currentY);

      currentY += 22;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#4B5563').text('Payment Method:', startX, currentY);
      doc.font('Helvetica').fontSize(10).fillColor('#111827').text(paymentMethod || 'UPI/Card', startX + 130, currentY);

      currentY += 26;
      // Draw another line before amount
      doc.lineWidth(1)
         .strokeColor('#E5E7EB')
         .moveTo(40, currentY)
         .lineTo(doc.page.width - 40, currentY)
         .stroke();

      currentY += 16;
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#1E3A8A').text('Registration Fee Paid:', startX, currentY);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#10B981').text(`INR Rs. ${Number(registrationFee).toFixed(2)}`, startX + 140, currentY);

      currentY += 35;
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#059669').text('Status: SUCCESSFUL / PAID', startX, currentY);

      doc.font('Helvetica-Oblique').fontSize(8).fillColor('#9CA3AF').text('This is an official computer-generated receipt issued by Sri Vasavi Engineering College.', 40, doc.page.height - 80, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateCertificatePDF, generateReceiptPDF };
