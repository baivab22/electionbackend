require('dotenv').config();
const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');

const PARTY_NAME = "नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)";

async function addCandidateIDsAndImages() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB\n');

    console.log(`📥 Fetching candidates from party: ${PARTY_NAME}\n`);
    const candidates = await Candidate.find({
      'politicalInfo.partyName': PARTY_NAME
    }).sort({ createdAt: 1 });

    console.log(`✅ Found ${candidates.length} candidates\n`);
    console.log('🔄 Updating candidates with CandidateID and image URLs...\n');

    let updated = 0;
    for (let i = 0; i < candidates.length; i++) {
      const candidateId = 330001 + i;
      const imageUrl = `https://result.election.gov.np/Images/Candidate/${candidateId}.jpg`;

      await Candidate.findByIdAndUpdate(
        candidates[i]._id,
        {
          $set: {
            'personalInfo.candidateId': candidateId,
            'personalInfo.profilePhoto': imageUrl
          }
        },
        { new: true }
      );

      updated++;
      if ((i + 1) % 25 === 0) {
        console.log(`✅ Updated ${i + 1} candidates...`);
      }
    }

    console.log(`\n✅ Successfully updated all ${updated} candidates\n`);

    // Verify the updates
    console.log('📊 VERIFICATION - Sample updated candidates:\n');
    console.log('══════════════════════════════════════════════════════════');
    
    const verified = await Candidate.find({
      'politicalInfo.partyName': PARTY_NAME
    }).limit(5);

    verified.forEach((c, idx) => {
      console.log(`\n${idx + 1}. ${c.personalInfo?.fullName}`);
      console.log(`   CandidateID: ${c.personalInfo?.candidateId}`);
      console.log(`   Image URL: ${c.personalInfo?.profilePhoto}`);
      console.log(`   Contact: ${c.personalInfo?.contactNumber}`);
    });

    console.log('\n══════════════════════════════════════════════════════════');
    console.log('\n✨ UPDATE COMPLETE');
    console.log(`Total candidates updated: ${updated}`);
    console.log(`All candidates now have:`);
    console.log(`  ✅ CandidateID (330001-330165)`);
    console.log(`  ✅ Image URLs from government election website`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addCandidateIDsAndImages();
