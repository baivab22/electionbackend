require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Candidate = require('../models/Candidate');

async function cleanImportWithTransform() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Delete ALL candidates
    console.log('🗑️  DELETING ALL CANDIDATES FROM DATABASE...');
    const deleteResult = await Candidate.deleteMany({});
    console.log(`✅ Deleted: ${deleteResult.deletedCount} candidates\n`);

    // Step 2: Read the data file
    const dataFilePath = path.join(__dirname, '../../client/src/constants/data.constant.txt');
    console.log(`📖 Reading data from: ${dataFilePath}`);
    
    const rawData = fs.readFileSync(dataFilePath, 'utf-8');
    const candidatesData = JSON.parse(rawData);
    
    console.log(`✅ Loaded ${candidatesData.length} candidates from file\n`);

    // Step 3: Transform to MongoDB schema
    console.log('🔄 TRANSFORMING DATA TO MONGODB SCHEMA...\n');
    
    const transformedData = candidatesData.map(candidate => {
      return {
        personalInfo: {
          fullName: candidate.CandidateName,
          age: candidate.AGE_YR || 0,
          gender: candidate.Gender,
          dateOfBirth: candidate.DOB,
          contactNumber: candidate.ContactNumber,
          fatherName: candidate.FATHER_NAME,
          profilePhoto: candidate.ImageURL,
          address: candidate.ADDRESS,
          district: candidate.DistrictName,
          candidateId: candidate.CandidateID
        },
        politicalInfo: {
          partyName: candidate.PoliticalPartyName,
          constituency: candidate.ConstName
        },
        biography: {
          bio_en: candidate.CandidateName,
          bio_np: candidate.CandidateName
        },
        education: candidate.QUALIFICATION ? [{
          qualification: candidate.QUALIFICATION,
          institution: candidate.NAMEOFINST || ''
        }] : [],
        professionalExperience: candidate.EXPERIENCE ? [{
          description: candidate.EXPERIENCE
        }] : [],
        achievements: [{
          title: 'Candidate',
          description: `${candidate.CandidateName}`
        }],
        issues: [],
        isActive: true,
        votingEnabled: true,
        likes: 0,
        shares: 0,
        votes: 0,
        votePercentage: 0,
        comments: []
      };
    });

    console.log(`✅ Transformed ${transformedData.length} candidates\n`);

    // Step 4: Insert data
    console.log('📥 INSERTING INTO DATABASE...\n');
    
    let inserted = 0;
    for (let i = 0; i < transformedData.length; i += 25) {
      const batch = transformedData.slice(i, i + 25);
      try {
        const result = await Candidate.insertMany(batch);
        inserted += result.length;
        const progress = Math.min(i + 25, transformedData.length);
        console.log(`✅ Inserted ${progress}/${transformedData.length} candidates...`);
      } catch (error) {
        console.error(`⚠️  Error:`, error.message);
      }
    }

    console.log(`\n✨ IMPORT COMPLETE`);
    console.log(`══════════════════════════════════════════════════════════`);
    console.log(`Total Deleted: ${deleteResult.deletedCount}`);
    console.log(`Total Transformed: ${transformedData.length}`);
    console.log(`Total Inserted: ${inserted}`);
    console.log(`Status: ${inserted === candidatesData.length ? '✅ PERFECT' : '⚠️  CHECK'}\n`);

    // Verify
    console.log('📊 SAMPLE VERIFICATION (First 3):\n');
    const verified = await Candidate.find({}).limit(3);
    
    verified.forEach((c, idx) => {
      console.log(`${idx + 1}. ${c.personalInfo?.fullName}`);
      console.log(`   CandidateID: ${c.personalInfo?.candidateId}`);
      console.log(`   Contact: ${c.personalInfo?.contactNumber}`);
      console.log(`   Constituency: ${c.politicalInfo?.constituency}\n`);
    });

    const totalCount = await Candidate.countDocuments({});
    console.log(`\n✅ Total candidates in database: ${totalCount}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanImportWithTransform();
