const mongoose = require('mongoose');
require('dotenv').config();
const Candidate = require('../models/Candidate');

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI not set in environment.');
    process.exit(1);
  }
  await mongoose.connect(mongoUri);
  const count = await Candidate.countDocuments();
  const sample = await Candidate.find().limit(10).lean();
  console.log('candidates_count:', count);
  console.log('sample_documents:', JSON.stringify(sample, null, 2));
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
