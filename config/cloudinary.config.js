// config/cloudinary.config.js
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

// Cloudinary Constants - Working configuration
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dpipulbgm';
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'tu_reports';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
const API_URL = process.env.API_URL || 'https://digitaldashboard.tu.edu.np/api/donater';

// Cloudinary SDK Configuration
// Note: API key/secret are optional if using unsigned uploads with upload preset
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

// Check if we have full credentials for server-side uploads
const hasFullCredentials = !!(process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

if (!hasFullCredentials) {
  console.log('ℹ️  Cloudinary: Using upload preset for unsigned uploads');
  console.log(`   Cloud: ${CLOUDINARY_CLOUD_NAME}, Preset: ${CLOUDINARY_UPLOAD_PRESET}`);
  console.log('   Note: For server-side management (delete old images), add API_KEY and API_SECRET to .env');
} else {
  console.log('✅ Cloudinary: Fully configured with API credentials');
}

module.exports = {
  cloudinary,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
  CLOUDINARY_UPLOAD_URL,
  API_URL,
  hasFullCredentials
};
