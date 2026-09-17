// scripts/fixGoogleIdIndex.js
//
// One-time cleanup for real users created BEFORE the models/User.js fix
// (the one that removed `default: null` from googleId, resetPasswordToken,
// resetPasswordExpires). Those old documents have the field explicitly set
// to null, which still collides with the unique+sparse index on googleId.
// This unsets the field entirely wherever it's currently null, so it goes
// back to genuinely absent — matching what the fixed schema now produces
// for every new signup.
//
// Safe to run multiple times. Only touches documents where the value IS
// null — never touches real Google IDs or real reset tokens.
//
// Run with:  node scripts/fixGoogleIdIndex.js

require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to ${mongoose.connection.name}`);

  const users = mongoose.connection.collection('users');

  const googleIdResult = await users.updateMany(
    { googleId: null },
    { $unset: { googleId: '' } }
  );
  console.log(`googleId: unset on ${googleIdResult.modifiedCount} document(s)`);

  const tokenResult = await users.updateMany(
    { resetPasswordToken: null },
    { $unset: { resetPasswordToken: '' } }
  );
  console.log(`resetPasswordToken: unset on ${tokenResult.modifiedCount} document(s)`);

  const expiresResult = await users.updateMany(
    { resetPasswordExpires: null },
    { $unset: { resetPasswordExpires: '' } }
  );
  console.log(`resetPasswordExpires: unset on ${expiresResult.modifiedCount} document(s)`);

  console.log('\nDone. Existing users can no longer collide on googleId: null.');
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Migration failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
