// config/index.js
// Validates required environment variables at startup — fails fast instead
// of letting the server run with a missing secret/connection string.
//
// This list is scoped to what the backend actually uses right now

const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'CLIENT_URL',
  'MONGO_URI',
  'SESSION_SECRET',
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
