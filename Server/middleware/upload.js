// Multer configured with memory storage — files are held as Buffers in RAM
// and never written to disk. The buffer is streamed directly to Cloudinary in utils/uploadToCloudinary.js.

const multer = require('multer');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 3;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    // Passing an Error here (rather than false with no error) surfaces a
    // clear message through errorHandler.js instead of Multer silently
    // dropping the file.
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only JPG, PNG, and WEBP images are allowed'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_FILES,
  },
});

module.exports = upload;
