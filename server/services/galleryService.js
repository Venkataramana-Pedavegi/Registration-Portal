const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Validates and stores a base64 media file to the uploads directory
 * @param {string} base64Data Raw base64 data string (e.g. data:image/png;base64,...)
 * @param {object} options Options including maxFileSize (in bytes) and allowedExtensions
 * @returns {string} The web-accessible relative path to the saved file
 */
const storeBase64File = (base64Data, options = {}) => {
  const {
    maxFileSize = 20 * 1024 * 1024, // 20 MB default limit
    allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm']
  } = options;

  // 1. Parse base64 header and data content
  const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid upload file format. Must be a valid base64 data URI.');
  }

  const mimeType = matches[1].toLowerCase();
  const rawData = matches[2];
  const fileBuffer = Buffer.from(rawData, 'base64');

  // 2. Validate file size
  if (fileBuffer.length > maxFileSize) {
    const sizeInMb = (maxFileSize / (1024 * 1024)).toFixed(1);
    throw new Error(`File is too large. Maximum allowed file size is ${sizeInMb}MB.`);
  }

  // 3. Resolve extension and validate MIME type
  let extension;
  switch (mimeType) {
    case 'image/jpeg':
    case 'image/jpg':
      extension = 'jpg';
      break;
    case 'image/png':
      extension = 'png';
      break;
    case 'image/webp':
      extension = 'webp';
      break;
    case 'video/mp4':
      extension = 'mp4';
      break;
    case 'video/webm':
      extension = 'webm';
      break;
    default:
      throw new Error(`Unsupported file type: ${mimeType}. Only JPG, PNG, WEBP, MP4, and WEBM are allowed.`);
  }

  if (!allowedExtensions.includes(extension)) {
    throw new Error(`Extension .${extension} is not permitted.`);
  }

  // 4. Generate unique filename
  const filename = `${crypto.randomBytes(16).toString('hex')}.${extension}`;
  const uploadDir = path.join(__dirname, '..', 'uploads', 'gallery');

  // 5. Ensure directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // 6. Write file
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, fileBuffer);

  // Return the web-accessible URL path
  return `/uploads/gallery/${filename}`;
};

module.exports = {
  storeBase64File,
};
