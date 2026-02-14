require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import Candidate model
const Candidate = require('../models/Candidate');

const PARTY_NAME = "नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)";

async function generateCleanData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB\n');

    // Fetch all candidates from the specific party
    console.log(`📥 Fetching candidates from party: ${PARTY_NAME}\n`);
    const candidates = await Candidate.find({
      'politicalInfo.partyName': PARTY_NAME
    }).lean();

    console.log(`✅ Found ${candidates.length} candidates\n`);

    // Format the data
    const formattedData = candidates.map((candidate, index) => {
      const dob = candidate.personalInfo?.dateOfBirth || '';
      const contactRaw = candidate.personalInfo?.contactNumber || '';
      
      // Remove last 2 digits from contact number (they represent age)
      let contact = contactRaw;
      if (contactRaw.length >= 2) {
        contact = contactRaw.slice(0, -2);
      }

      // Generate a CandidateID (using a consistent pattern based on index or name hash)
      const candidateId = 330000 + index + 1;

      return {
        CandidateID: candidateId,
        CandidateName: candidate.personalInfo?.fullName || 'Unknown',
        AGE_YR: candidate.personalInfo?.age || 0,
        Gender: candidate.personalInfo?.gender || 'पुरुष',
        PoliticalPartyName: candidate.politicalInfo?.partyName,
        DistrictName: candidate.politicalInfo?.district || '',
        ConstName: candidate.politicalInfo?.constituency || '',
        ContactNumber: contact,
        DOB: dob,
        ImageURL: `https://result.election.gov.np/Images/Candidate/${candidateId}.jpg`,
        FATHER_NAME: candidate.personalInfo?.fatherName || '',
        QUALIFICATION: candidate.education?.[0]?.qualification || '',
        ADDRESS: candidate.personalInfo?.address || '',
        EXPERIENCE: candidate.professionalExperience?.[0]?.description || '0'
      };
    });

    // Save as JSON file
    const outputPath = path.join(__dirname, '../data/clean-communist-candidates.json');
    fs.writeFileSync(outputPath, JSON.stringify(formattedData, null, 2), 'utf-8');
    console.log(`\n✅ Data saved to: ${outputPath}\n`);

    // Also save as formatted text file in constants
    let textContent = `// Communist Party (Unified Marxist-Leninist) Candidates\n`;
    textContent += `// Total: ${formattedData.length} candidates\n`;
    textContent += `// Generated: ${new Date().toISOString()}\n\n`;
    textContent += `export const COMMUNIST_CANDIDATES = [\n`;

    formattedData.forEach((candidate, idx) => {
      textContent += `  {\n`;
      textContent += `    candidateId: ${candidate.CandidateID},\n`;
      textContent += `    name: '${candidate.CandidateName}',\n`;
      textContent += `    age: ${candidate.AGE_YR},\n`;
      textContent += `    gender: '${candidate.Gender}',\n`;
      textContent += `    party: '${candidate.PoliticalPartyName}',\n`;
      textContent += `    district: '${candidate.DistrictName}',\n`;
      textContent += `    constituency: '${candidate.ConstName}',\n`;
      textContent += `    contact: '${candidate.ContactNumber}',\n`;
      textContent += `    dob: '${candidate.DOB}',\n`;
      textContent += `    image: '${candidate.ImageURL}',\n`;
      textContent += `    fatherName: '${candidate.FATHER_NAME}',\n`;
      textContent += `    qualification: '${candidate.QUALIFICATION}',\n`;
      textContent += `    address: '${candidate.ADDRESS}',\n`;
      textContent += `    experience: '${candidate.EXPERIENCE}'\n`;
      textContent += `  }${idx < formattedData.length - 1 ? ',' : ''}\n`;
    });

    textContent += `];\n`;

    const constantsPath = path.join(__dirname, '../../client/src/constants/communist-candidates.ts');
    fs.writeFileSync(constantsPath, textContent, 'utf-8');
    console.log(`✅ Constants file saved to: ${constantsPath}\n`);

    // Display sample data
    console.log('📊 SAMPLE DATA (First 5 candidates):\n');
    console.log('══════════════════════════════════════════════════════════');
    formattedData.slice(0, 5).forEach((c, idx) => {
      console.log(`\n${idx + 1}. ${c.CandidateName}`);
      console.log(`   ID: ${c.CandidateID}`);
      console.log(`   Constituency: ${c.ConstName}`);
      console.log(`   Contact (cleaned): ${c.ContactNumber}`);
      console.log(`   Image: ${c.ImageURL}`);
      console.log(`   Age: ${c.AGE_YR}, Gender: ${c.Gender}`);
    });

    console.log('\n══════════════════════════════════════════════════════════');
    console.log(`\n✨ GENERATION COMPLETE`);
    console.log(`Total candidates processed: ${formattedData.length}`);
    console.log(`Files created:`);
    console.log(`  1. ${outputPath}`);
    console.log(`  2. ${constantsPath}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

generateCleanData();
