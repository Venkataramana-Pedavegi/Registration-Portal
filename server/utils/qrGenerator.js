const QRCode = require('qrcode');

const generateQRCode = async (data) => {
  try {
    const payload = typeof data === 'object' ? JSON.stringify(data) : String(data);
    const qrDataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#1E3A8A',
        light: '#FFFFFF',
      },
    });
    return qrDataUrl;
  } catch (error) {
    console.error('QR Code generation error:', error.message);
    throw error;
  }
};

module.exports = { generateQRCode };
