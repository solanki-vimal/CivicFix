// Configures the Cloudinary v2 SDK from env vars. Actual upload logic lives
// in utils/uploadToCloudinary.js — this file only sets credentials.

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
