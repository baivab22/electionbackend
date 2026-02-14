const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Candidate = require('../models/Candidate');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sandipbidari007_db_user:GfS3lzMMgYKQGA5i@cluster0.9fhie0j.mongodb.net/election';

async function importAllCandidates() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected!');

    // Read the data file exactly as is
    const dataFilePath = path.join(__dirname, '../../client/src/constants/data.constant.txt');
    console.log(`📖 Reading data file: ${dataFilePath}`);
    
    const rawData = fs.readFileSync(dataFilePath, 'utf8');
    const candidatesData = JSON.parse(rawData);
    
    console.log(`📊 Total candidates found: ${candidatesData.length}`);

    // Clear existing candidates
    console.log('🗑️  Clearing existing candidates...');
    await Candidate.deleteMany({});
    console.log('✅ Cleared all existing candidates');

    // Import exactly as they are in the file with sequential IDs
    const importedCandidates = [];
    
    console.log(`Processing ${candidatesData.length} candidates...`);
    
    for (let i = 0; i < candidatesData.length; i++) {
      const data = candidatesData[i];
      
      const candidate = new Candidate({
        candidateId: i + 1, // Sequential ID: 1, 2, 3, etc.
        personalInfo: {
          fullName: data.CandidateName || '',
          age: parseInt(data.AGE_YR) || 0,
          gender: data.Gender || '',
          dateOfBirth: data.DOB ? new Date(data.DOB) : null,
          contactNumber: data.ContactNumber || '',
          fatherName: data.FATHER_NAME || '',
          address: data.ADDRESS || '',
          profilePhoto: data.ImageURL || '',
          district: data.DistrictName || ''
        },
        politicalInfo: {
          partyName: data.PoliticalPartyName || '',
          constituency: data.ConstName || '',
          candidacyLevel: 'Parliamentary',
          symbol: 'सुर्य'
        },
        additional: {
          biography: data.CandidateName || '',
          education: data.QUALIFICATION || '',
          professionalExperience: data.EXPERIENCE || '',
          achievements: '',
          issues: [],
          manifesto: ''
        },
        votingEnabled: true,
        isActive: true
      });
      
      importedCandidates.push(candidate);
    }

    // Batch insert
    console.log('💾 Inserting all candidates into database...');
    await Candidate.insertMany(importedCandidates);
    console.log(`✅ Successfully imported ${importedCandidates.length} candidates`);

    // Verify import
    const count = await Candidate.countDocuments();
    console.log(`\n✅ DATABASE VERIFICATION:`);
    console.log(`   Total candidates in DB: ${count}`);

    // Show first and last few
    const first3 = await Candidate.find().limit(3);
    const last3 = await Candidate.find().sort({ candidateId: -1 }).limit(3);
    
    console.log(`\n📋 First 3 candidates imported:`);
    first3.forEach((candidate, index) => {
      console.log(`   ${index + 1}. ID: ${candidate.candidateId} - ${candidate.personalInfo.fullName}`);
    });

    console.log(`\n📋 Last 3 candidates imported:`);
    last3.reverse().forEach((candidate, index) => {
      console.log(`   ${count - 2 + index}. ID: ${candidate.candidateId} - ${candidate.personalInfo.fullName}`);
    });

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log(`✅ ALL ${count} CANDIDATES IMPORTED SUCCESSFULLY!`);
    console.log('   Sequential IDs: 1 to ' + count);
    console.log('════════════════════════════════════════════════════════════════');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

importAllCandidates();
