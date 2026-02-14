const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Candidate = require('../models/Candidate');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sandipbidari007_db_user:GfS3lzMMgYKQGA5i@cluster0.9fhie0j.mongodb.net/election';

async function importCandidatesExactFormat() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected!');

    // Read the data file
    const dataFilePath = path.join(__dirname, '../../client/src/constants/data.constant.txt');
    console.log(`📖 Reading data file: ${dataFilePath}`);
    
    const rawData = fs.readFileSync(dataFilePath, 'utf8');
    const candidatesData = JSON.parse(rawData);
    
    console.log(`📊 Total candidates found: ${candidatesData.length}`);

    // Clear existing candidates
    console.log('🗑️  Clearing existing candidates...');
    await Candidate.deleteMany({});
    console.log('✅ Cleared all existing candidates');

    // Import EXACTLY as they are in the file
    const importedCandidates = [];
    
    console.log(`Processing ${candidatesData.length} candidates...`);
    
    for (let i = 0; i < candidatesData.length; i++) {
      const data = candidatesData[i];
      
      // Store raw data exactly as is
      const candidate = new Candidate({
        personalInfo: {
          fullName: data.CandidateName || '',
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
          constituency: data.ConstName || ''
        },
        education: {
          highestQualification: data.QUALIFICATION || ''
        },
        professionalExperience: {
          previousExperience: data.EXPERIENCE || ''
        },
        isActive: true,
        // Store the CandidateID in rawSource to preserve original data
        rawSource: {
          CandidateID: data.CandidateID,
          CandidateName: data.CandidateName,
          AGE_YR: data.AGE_YR,
          Gender: data.Gender,
          PoliticalPartyName: data.PoliticalPartyName,
          DistrictName: data.DistrictName,
          ConstName: data.ConstName,
          ContactNumber: data.ContactNumber,
          DOB: data.DOB,
          ImageURL: data.ImageURL,
          FATHER_NAME: data.FATHER_NAME,
          QUALIFICATION: data.QUALIFICATION,
          ADDRESS: data.ADDRESS,
          EXPERIENCE: data.EXPERIENCE
        }
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
    const last3 = await Candidate.find().sort({ _id: -1 }).limit(3);
    
    console.log(`\n📋 First 3 candidates imported:`);
    first3.forEach((candidate, index) => {
      console.log(`   ${index + 1}. ${candidate.personalInfo.fullName} (ID: ${candidate.rawSource.CandidateID})`);
    });

    console.log(`\n📋 Last 3 candidates imported:`);
    last3.reverse().forEach((candidate) => {
      console.log(`   ${candidate.personalInfo.fullName} (ID: ${candidate.rawSource.CandidateID})`);
    });

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log(`✅ ALL ${count} CANDIDATES IMPORTED SUCCESSFULLY!`);
    console.log('   Data imported exactly in the same format as file');
    console.log('════════════════════════════════════════════════════════════════');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

importCandidatesExactFormat();
