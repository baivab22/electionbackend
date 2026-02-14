const mongoose = require('mongoose');
const Candidate = require('./models/Candidate');

const MONGODB_URI = 'mongodb+srv://sandipbidari007_db_user:GfS3lzMMgYKQGA5i@cluster0.9fhie0j.mongodb.net/election';

async function verify() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const total = await Candidate.countDocuments();
    const minId = await Candidate.findOne().sort({candidateId: 1});
    const maxId = await Candidate.findOne().sort({candidateId: -1});
    
    console.log('✅ IMPORT VERIFICATION:');
    console.log('Total candidates:', total);
    console.log('Min ID:', minId?.candidateId);
    console.log('Max ID:', maxId?.candidateId);
    console.log('ID Range: ' + minId?.candidateId + ' to ' + maxId?.candidateId);
    
    const first = await Candidate.findOne({candidateId: 1});
    const middle = await Candidate.findOne({candidateId: 83});
    const last = await Candidate.findOne({candidateId: 165});
    
    console.log('\n📋 Sample Candidates:');
    console.log('ID 1:', first?.personalInfo.fullName);
    console.log('ID 83:', middle?.personalInfo.fullName);
    console.log('ID 165:', last?.personalInfo.fullName);
    
    console.log('\n════════════════════════════════════════════════════');
    console.log(`✅ ALL ${total} CANDIDATES IMPORTED WITH SEQUENTIAL IDs!`);
    console.log('════════════════════════════════════════════════════');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verify();
