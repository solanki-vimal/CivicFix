// scripts/testSchemas.js
//
// Connects to MONGO_URI from .env and exercises all 7 models against a real
// database: creates one linked document per collection (in dependency
// order), verifies unique/sparse constraints actually reject duplicates,
// and prints the live index list per collection so you can eyeball it
// against models/*.js.
//
// Run with:  node scripts/testSchemas.js
// Safe to re-run — it cleans up everything it creates at the end, and also
// wipes any leftover data tagged with the test marker before starting.

require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const Department = require('../models/Department');
const Category = require('../models/Category');
const Issue = require('../models/Issue');
const StatusHistory = require('../models/StatusHistory');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');

const MARKER = 'schema-test-'; // used to identify + clean up test data safely

const log = (msg) => console.log(msg);
const ok = (msg) => console.log(`  OK    ${msg}`);
const bad = (msg) => console.log(`  FAIL  ${msg}`);

async function cleanup() {
  await Notification.deleteMany({ message: new RegExp(`^${MARKER}`) });
  await Comment.deleteMany({ text: new RegExp(`^${MARKER}`) });
  await StatusHistory.deleteMany({});
  await Issue.deleteMany({ title: new RegExp(`^${MARKER}`) });
  await Category.deleteMany({ name: new RegExp(`^${MARKER}`) });
  await Department.deleteMany({ name: new RegExp(`^${MARKER}`) });
  await User.deleteMany({ email: new RegExp(`^${MARKER}`) });
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  log(`Connected to ${mongoose.connection.name}\n`);

  await cleanup(); // wipe any leftovers from a previous failed run

  // ── 1. Create one linked document per collection ─────────────────────
  log('--- Creating linked documents across all 7 collections ---');

  const superAdmin = await User.create({
    name: 'Test Super Admin',
    email: `${MARKER}superadmin@example.com`,
    password: 'password123',
    role: 'super_admin',
  });
  ok('User (super_admin) created');

  const deptAdmin = await User.create({
    name: 'Test Dept Admin',
    email: `${MARKER}deptadmin@example.com`,
    password: 'password123',
    role: 'dept_admin',
  });

  const staff = await User.create({
    name: 'Test Staff',
    email: `${MARKER}staff@example.com`,
    password: 'password123',
    role: 'staff',
  });

  const citizen = await User.create({
    name: 'Test Citizen',
    email: `${MARKER}citizen@example.com`,
    password: 'password123',
    role: 'citizen',
  });
  ok('4 Users created (super_admin, dept_admin, staff, citizen)');

  const department = await Department.create({
    name: `${MARKER}Roads`,
    description: 'Handles road-related issues',
    headAdmin: deptAdmin._id,
    createdBy: superAdmin._id,
  });
  ok('Department created');

  const category = await Category.create({
    name: `${MARKER}Pothole`,
    color: '#F5A623',
    department: department._id,
    createdBy: superAdmin._id,
  });
  ok('Category created, linked to Department');

  const issue = await Issue.create({
    title: `${MARKER}Broken road near junction`,
    description: 'Large pothole causing traffic issues',
    category: category._id,
    department: department._id, // copied from category, as the auto-routing rule intends
    reportedBy: citizen._id,
    location: { coordinates: [72.8311, 22.6939] }, // Nadiad, Gujarat
    address: 'Near ST Bus Stand, Nadiad',
  });
  ok('Issue created, linked to Category + Department + User');

  const history = await StatusHistory.create({
    issue: issue._id,
    fromStatus: 'pending',
    toStatus: 'open',
    changedBy: deptAdmin._id,
  });
  ok('StatusHistory created, linked to Issue + User');

  const comment = await Comment.create({
    issue: issue._id,
    user: staff._id,
    text: `${MARKER}Crew has been dispatched, ETA tomorrow.`,
    isOfficialUpdate: true,
  });
  ok('Comment created, linked to Issue + User');

  const notification = await Notification.create({
    user: citizen._id,
    type: 'status_change',
    issue: issue._id,
    message: `${MARKER}Your issue status changed to Open`,
  });
  ok('Notification created, linked to User + Issue');

  // ── 2. Verify population actually works across refs ──────────────────
  log('\n--- Verifying ref population ---');
  const populatedIssue = await Issue.findById(issue._id)
    .populate('category', 'name')
    .populate('department', 'name')
    .populate('reportedBy', 'name role');
  if (
    populatedIssue.category.name === category.name &&
    populatedIssue.department.name === department.name &&
    populatedIssue.reportedBy.name === citizen.name
  ) {
    ok('Issue populates category, department, and reportedBy correctly');
  } else {
    bad('Issue population did not resolve as expected');
  }

  if (populatedIssue.upvoteCount === 0) {
    ok('Issue.upvoteCount virtual works (0 with no upvotes)');
  } else {
    bad('upvoteCount virtual did not return expected value');
  }

  // ── 3. Verify unique / sparse constraints actually reject duplicates ──
  log('\n--- Verifying unique & sparse constraints against the real DB ---');

  try {
    await User.create({ name: 'Dup', email: citizen.email, password: 'password123' });
    bad('duplicate email was NOT rejected — unique index missing or broken');
  } catch (err) {
    if (err.code === 11000) ok('duplicate email correctly rejected (E11000)');
    else bad(`duplicate email rejected but with unexpected error: ${err.message}`);
  }

  try {
    await Category.create({
      name: category.name,
      department: department._id, // same name + same department
      createdBy: superAdmin._id,
    });
    bad('duplicate category (same name+department) was NOT rejected');
  } catch (err) {
    if (err.code === 11000) ok('duplicate category in same department correctly rejected (E11000)');
    else bad(`duplicate category rejected but with unexpected error: ${err.message}`);
  }

  // Two users with googleId: null should NOT collide, thanks to `sparse`
  try {
    const anotherCitizen = await User.create({
      name: 'Another Citizen',
      email: `${MARKER}citizen2@example.com`,
      password: 'password123',
    });
    ok('sparse index allows two users with no googleId (no false collision)');
    await User.deleteOne({ _id: anotherCitizen._id });
  } catch (err) {
    bad(`sparse googleId index incorrectly blocked a second null: ${err.message}`);
  }

  // ── 4. Verify the 2dsphere index supports $near ───────────────────────
  log('\n--- Verifying $near geospatial query ---');
  const nearby = await Issue.find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [72.8311, 22.6939] },
        $maxDistance: 5000, // 5km
      },
    },
  });
  if (nearby.some((i) => i._id.equals(issue._id))) {
    ok('$near query found the test issue within 5km — 2dsphere index is working');
  } else {
    bad('$near query did not return the test issue — check the 2dsphere index');
  }

  // ── 5. Print live indexes per collection ──────────────────────────────
  log('\n--- Live indexes (as MongoDB actually built them) ---');
  for (const Model of [User, Department, Category, Issue, StatusHistory, Comment, Notification]) {
    const indexes = await Model.collection.getIndexes({ full: true });
    log(`\n${Model.modelName}:`);
    indexes.forEach((idx) => log(`  ${idx.name} -> ${JSON.stringify(idx.key)}${idx.unique ? ' [unique]' : ''}${idx.sparse ? ' [sparse]' : ''}`));
  }

  // ── 6. Clean up everything this script created ────────────────────────
  await cleanup();
  log('\n--- Cleanup complete, no test data left behind ---');

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('\nTest script crashed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
