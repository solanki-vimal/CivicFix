/*
Validates required environment variables at startup — fails fast instead
of letting the server run with a missing secret/connection string.
*/

const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'CLIENT_URL',
  'MONGO_URI',
  'SESSION_SECRET',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

const validateEnv = () => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  console.log('✅ All environment variables validated');
};

module.exports = { validateEnv };
