const mongoose = require('mongoose');
const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Candidate = require('../models/Candidate');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sandipbidari007_db_user:GfS3lzMMgYKQGA5i@cluster0.9fhie0j.mongodb.net/election';

// Map Nepali gender values to English
function mapGender(genderValue) {
  if (!genderValue) return 'Other';
  const value = genderValue.toLowerCase().trim();
  if (value.includes('पुरुष') || value.includes('male')) return 'Male';
  if (value.includes('महिला') || value.includes('female')) return 'Female';
  return 'Other';
}

function fetchDataFromURL(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          // Remove UTF-8 BOM if present
          if (data.charCodeAt(0) === 0xFEFF) {
            data = data.slice(1);
          }
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

async function importCandidatesFromURL() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected!');

    const url = 'https://result.election.gov.np/JSONFiles/ElectionResultCentral2082.txt';
    console.log(`📖 Fetching data from: ${url}`);
    
    const candidatesData = await fetchDataFromURL(url);
    console.log(`📊 Total candidates found: ${candidatesData.length}`);

    // Clear existing candidates
    console.log('🗑️  Clearing existing candidates...');
    await Candidate.deleteMany({});
    console.log('✅ Cleared all existing candidates');

    // Import all candidates
    const importedCandidates = [];
    console.log(`Processing ${candidatesData.length} candidates...`);
    
    for (let i = 0; i < candidatesData.length; i++) {
      const data = candidatesData[i];
      
      const candidateObj = {
        candidateId: data.CandidateID?.toString() || '',
        personalInfo: {
          fullName: data.CandidateName || 'Unknown',
          gender: mapGender(data.Gender),
          dateOfBirth: data.DOB ? new Date(data.DOB) : null,
          contactNumber: data.ContactNumber || '',
          fatherName: data.FATHER_NAME || '',
          address: data.ADDRESS || '',
          profilePhoto: data.ImageURL || '',
          district: data.DistrictName || ''
        },
        politicalInfo: {
          partyName: data.PoliticalPartyName || '',
          constituency: (data.ConstName || '').toString()
        },
        education: {
          highestQualification: data.QUALIFICATION || ''
        },
        professionalExperience: {
          previousExperience: data.EXPERIENCE || ''
        },
        isActive: true,
        rawSource: data
      };
      
      importedCandidates.push(candidateObj);

      if ((i + 1) % 100 === 0) {
        console.log(`  Processed ${i + 1}/${candidatesData.length}...`);
      }
    }

    // Batch insert (in chunks to avoid memory issues)
    console.log('💾 Inserting all candidates into database...');
    
    let totalInserted = 0;
    const chunkSize = 100;
    
    for (let i = 0; i < importedCandidates.length; i += chunkSize) {
      const chunk = importedCandidates.slice(i, i + chunkSize);
      try {
        const result = await Candidate.insertMany(chunk, { ordered: false });
        const count = result ? result.length : 0;
        totalInserted += count;
        if (i === 0) {
          console.log(`DEBUG: First chunk result type: ${typeof result}, is array: ${Array.isArray(result)}, length: ${count}`);
        }
      } catch (err) {
        console.error(`Error inserting chunk ${Math.floor(i/chunkSize) + 1}:`, err.message);
      }
      
      if ((i + chunkSize) % 1000 === 0 || i === 0) {
        console.log(`  Inserted ${i + chunkSize}/${importedCandidates.length} documents...`);
      }
    }
    
    console.log(`✅ Successfully inserted ${totalInserted} candidates`);

    // Verify import
    console.log('⏳ Waiting for database to process...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const count = await Candidate.countDocuments();
    console.log(`\n✅ DATABASE VERIFICATION:`);
    console.log(`   Total candidates in DB: ${count}`);

    // Show first and last few
    const first3 = await Candidate.find().limit(3);
    const last3 = await Candidate.find().sort({ _id: -1 }).limit(3);
    
    console.log(`\n📋 First 3 candidates:`);
    first3.forEach((candidate, index) => {
      console.log(`   ${index + 1}. ${candidate.personalInfo.fullName}`);
    });

    console.log(`\n📋 Last 3 candidates:`);
    last3.reverse().forEach((candidate) => {
      console.log(`   ${candidate.personalInfo.fullName}`);
    });

    console.log('\n✅ ALL CANDIDATES IMPORTED!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

importCandidatesFromURL();
