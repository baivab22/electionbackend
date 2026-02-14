const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Candidate = require('../models/Candidate');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sandipbidari007_db_user:GfS3lzMMgYKQGA5i@cluster0.9fhie0j.mongodb.net/election';

async function importCandidates() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected!');

    // Read the data file
    const dataFilePath = path.join(__dirname, '../../client/src/constants/data.constant.txt');
    console.log(`📖 Reading data file: ${dataFilePath}`);
    
    const rawData = fs.readFileSync(dataFilePath, 'utf8');
    const candidatesData = JSON.parse(rawData);
    
    console.log(`📊 Total candidates in file: ${candidatesData.length}`);

    // Clear existing candidates
    console.log('🗑️  Clearing existing candidates...');
    await Candidate.deleteMany({});
    console.log('✅ Cleared all existing candidates');

    // Import with sequential IDs
    const importedCandidates = [];
    for (let i = 0; i < candidatesData.length; i++) {
      const candidateData = candidatesData[i];
      
      const newCandidate = {
        candidateId: i + 1, // Sequential ID: 1, 2, 3...
        personalInfo: {
          fullName: candidateData.CandidateName || '',
          age: candidateData.AGE_YR || 0,
          gender: candidateData.Gender || '',
          dateOfBirth: candidateData.DOB || null,
          contactNumber: candidateData.ContactNumber?.slice(0, -2) || '', // Remove last 2 digits
          fatherName: candidateData.FATHER_NAME || '',
          address: candidateData.ADDRESS || '',
          profilePhoto: candidateData.ImageURL || '',
          district: candidateData.DistrictName || ''
        },
        politicalInfo: {
          partyName: candidateData.PoliticalPartyName || '',
          constituency: candidateData.ConstName || '',
          candidacyLevel: 'Parliamentary',
          symbol: 'सुर्य'
        },
        additional: {
          biography: candidateData.CandidateName || '',
          education: candidateData.QUALIFICATION || '',
          professionalExperience: candidateData.EXPERIENCE || '',
          achievements: '',
          issues: [],
          manifesto: ''
        },
        votingEnabled: true,
        isActive: true
      };
      
      importedCandidates.push(newCandidate);
    }

    // Batch insert
    console.log('💾 Inserting candidates into database...');
    await Candidate.insertMany(importedCandidates);
    console.log(`✅ Successfully imported ${importedCandidates.length} candidates`);

    // Verify import
    const count = await Candidate.countDocuments();
    console.log(`\n✅ DATABASE VERIFICATION:`);
    console.log(`   Total candidates in DB: ${count}`);

    // Show first few
    const first3 = await Candidate.find().limit(3);
    console.log(`\n📋 Sample of imported candidates:`);
    first3.forEach((candidate, index) => {
      console.log(`   ${index + 1}. ID: ${candidate.candidateId} - ${candidate.personalInfo.fullName} (${candidate.personalInfo.contactNumber})`);
    });

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('✅ ALL CANDIDATES IMPORTED SUCCESSFULLY WITH SEQUENTIAL IDs!');
    console.log('════════════════════════════════════════════════════════════════');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

importCandidates();
