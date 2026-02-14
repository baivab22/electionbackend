const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Candidate = require('../models/Candidate');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sandipbidari007_db_user:GfS3lzMMgYKQGA5i@cluster0.9fhie0j.mongodb.net/election';

async function deleteAllCandidates() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected!');

    console.log('🗑️  Deleting all candidates...');
    const result = await Candidate.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} candidates`);

    const count = await Candidate.countDocuments();
    console.log(`\n📊 Remaining candidates in DB: ${count}`);

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('✅ ALL CANDIDATES DELETED SUCCESSFULLY!');
    console.log('════════════════════════════════════════════════════════════════');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteAllCandidates();
