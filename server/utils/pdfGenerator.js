const PDFDocument = require('pdfkit');

const generateCertificatePDF = ({ studentName, eventTitle, organizer, certificateId, issueDate, qrCodeUrl }) => {
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

      // Background Border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
         .lineWidth(4)
         .stroke('#1E3A8A');

      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
         .lineWidth(1.5)
         .stroke('#3B82F6');

      // Header Title
      doc.moveDown(2);
      doc.font('Helvetica-Bold')
         .fontSize(32)
         .fillColor('#1E3A8A')
         .text('CERTIFICATE OF PARTICIPATION', { align: 'center' });

      doc.moveDown(0.5);
      doc.font('Helvetica')
         .fontSize(14)
         .fillColor('#6B7280')
         .text('THIS IS PROUDLY PRESENTED TO', { align: 'center' });

      // Student Name
      doc.moveDown(0.8);
      doc.font('Helvetica-Bold')
         .fontSize(28)
         .fillColor('#111827')
         .text(studentName.toUpperCase(), { align: 'center' });

      doc.moveDown(0.5);
      doc.font('Helvetica')
         .fontSize(13)
         .fillColor('#4B5563')
         .text(`For active participation and successful completion of the campus event:`, { align: 'center' });

      // Event Title
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold')
         .fontSize(20)
         .fillColor('#2563EB')
         .text(`"${eventTitle}"`, { align: 'center' });

      doc.moveDown(0.5);
      doc.font('Helvetica')
         .fontSize(12)
         .fillColor('#6B7280')
         .text(`Organized by ${organizer} on ${new Date(issueDate).toLocaleDateString()}`, { align: 'center' });

      // Certificate Metadata Footer
      doc.moveDown(2);
      const footerY = doc.page.height - 110;
      doc.fontSize(10)
         .fillColor('#9CA3AF')
         .text(`Certificate ID: ${certificateId}`, 50, footerY);

      doc.fontSize(10)
         .fillColor('#9CA3AF')
         .text(`Issued Date: ${new Date(issueDate).toLocaleDateString()}`, 50, footerY + 15);

      // Embed QR verification image if present
      if (qrCodeUrl && qrCodeUrl.startsWith('data:image')) {
        const base64Data = qrCodeUrl.replace(/^data:image\/\w+;base64,/, '');
        const qrBuffer = Buffer.from(base64Data, 'base64');
        doc.image(qrBuffer, doc.page.width - 150, footerY - 20, { width: 80 });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateCertificatePDF };
