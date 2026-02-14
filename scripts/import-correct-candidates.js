require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Candidate = require('../models/Candidate');

const PARTY_NAME = "नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)";

async function importCandidatesFromCorrectData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB\n');

    // Read the correct data file
    const dataFilePath = path.join(__dirname, '../../client/src/constants/data.constant.txt');
    console.log(`📖 Reading data from: ${dataFilePath}`);
    
    const rawData = fs.readFileSync(dataFilePath, 'utf-8');
    const candidatesData = JSON.parse(rawData);
    
    console.log(`✅ Loaded ${candidatesData.length} candidates from file\n`);

    // Delete all existing candidates
    console.log('🗑️  Deleting all existing candidates from database...');
    const deleteResult = await Candidate.deleteMany({
      'politicalInfo.partyName': PARTY_NAME
    });
    console.log(`✅ Deleted ${deleteResult.deletedCount} candidates\n`);

    // Transform and insert candidates
    console.log('🔄 Transforming and inserting candidates...');
    const transformedCandidates = candidatesData.map((candidate, index) => {
      // Clean phone number - remove last 2 digits (age)
      let contact = candidate.ContactNumber || '';
      if (contact.length >= 2) {
        contact = contact.slice(0, -2);
      }

      // Generate image URL
      const candidateId = candidate.CandidateID;
      const imageUrl = `https://result.election.gov.np/Images/Candidate/${candidateId}.jpg`;

      return {
        personalInfo: {
          fullName: candidate.CandidateName,
          age: candidate.AGE_YR || 0,
          gender: candidate.Gender || 'Male',
          dateOfBirth: candidate.DOB || new Date(),
          contactNumber: contact,
          fatherName: candidate.FATHER_NAME || '',
          address: candidate.ADDRESS || '',
          profilePhoto: imageUrl,
          candidateId: candidateId,
          district: candidate.DistrictName || candidate.DistrictName || ''
        },
        politicalInfo: {
          partyName: PARTY_NAME,
          party: PARTY_NAME,
          constituency: candidate.ConstName || 'Unknown',
          candidacyLevel: 'Parliamentary',
          symbol: 'सुर्य'
        },
        biography: {
          bio_en: candidate.CandidateName,
          bio_np: candidate.CandidateName,
          profilePhoto: imageUrl
        },
        education: [
          {
            qualification: candidate.QUALIFICATION || 'Not specified',
            institution: candidate.NAMEOFINST || 'Unknown'
          }
        ],
        professionalExperience: [
          {
            description: candidate.EXPERIENCE || 'Not specified'
          }
        ],
        achievements: [
          {
            title: 'Active Candidate',
            description: `${candidate.CandidateName} is an active candidate from ${candidate.ConstName}`
          }
        ],
        issues: [
          {
            title: 'Community Development',
            description: 'Committed to community development'
          }
        ],
        manifesto: {
          title_en: `${candidate.CandidateName}'s Vision`,
          title_np: `${candidate.CandidateName}को दृष्टिकोण`,
          content_en: `${candidate.CandidateName} is committed to bringing positive change.`,
          content_np: `${candidate.CandidateName} सकारात्मक परिवर्तन लाने प्रतिबद्ध छन्।`
        },
        isActive: true,
        votingEnabled: true,
        likes: 0,
        shares: 0,
        votes: 0,
        votePercentage: 0,
        comments: []
      };
    });

    // Insert into database
    console.log(`\n📥 Inserting ${transformedCandidates.length} candidates into database...\n`);
    
    const options = { ordered: false }; // Continue on error
    let inserted = 0;
    let failed = 0;
    
    for (let i = 0; i < transformedCandidates.length; i += 25) {
      const batch = transformedCandidates.slice(i, i + 25);
      try {
        const result = await Candidate.insertMany(batch, options);
        inserted += result.length;
        const progress = Math.min(i + 25, transformedCandidates.length);
        console.log(`✅ Inserted ${progress}/${transformedCandidates.length} candidates...`);
      } catch (error) {
        console.error(`⚠️  Error in batch ${Math.floor(i / 25) + 1}:`, error.message);
        failed += batch.length;
      }
    }

    console.log(`\n✨ IMPORT COMPLETE`);
    console.log(`══════════════════════════════════════════════════════════`);
    console.log(`Total Inserted: ${inserted}`);
    console.log(`Failed: ${failed}`);
    console.log(`Successfully imported ${inserted} candidates with:`);
    console.log(`  ✅ CORRECT CandidateIDs from data.constant.txt`);
    console.log(`  ✅ Cleaned phone numbers (age digits removed)`);
    console.log(`  ✅ Government website image URLs`);
    console.log(`  ✅ Complete candidate profiles\n`);

    // Verify first 5
    console.log('📊 SAMPLE VERIFICATION (First 5):\n');
    const verified = await Candidate.find({
      'politicalInfo.partyName': PARTY_NAME
    }).limit(5);

    verified.forEach((c, idx) => {
      console.log(`${idx + 1}. ${c.personalInfo?.fullName}`);
      console.log(`   CandidateID: ${c.personalInfo?.candidateId}`);
      console.log(`   Constituency: ${c.politicalInfo?.constituency}`);
      console.log(`   Contact: ${c.personalInfo?.contactNumber}`);
      console.log(`   Image: ${c.personalInfo?.profilePhoto}\n`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

importCandidatesFromCorrectData();
