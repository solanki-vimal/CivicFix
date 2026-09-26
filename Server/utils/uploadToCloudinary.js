// Streams an in-memory buffer (from Multer) directly to Cloudinary — never
// touches disk.

const cloudinary = require('../config/cloudinary');

const uploadBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'civicfix/issues',
        transformation: [{ width: 1200, crop: 'limit' }, { quality: 80, fetch_format: 'webp' }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });

// Uploads every file in parallel and returns an array of secure_urls in the
// same order as the input files. If any single upload fails, the whole
// batch rejects — createIssue's caller decides what to do with that.
const uploadIssueImages = async (files) => {
  if (!files || files.length === 0) return [];
  return Promise.all(files.map((file) => uploadBuffer(file.buffer)));
};

module.exports = { uploadIssueImages };
