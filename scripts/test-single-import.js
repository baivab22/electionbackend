const https = require('https');
const Candidate = require('../models/Candidate');
const mongoose = require('mongoose');
require('dotenv').config();

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          if (data.charCodeAt(0) === 0xFEFF) { data = data.slice(1); }
          resolve(JSON.parse(data));
        } catch (err) { reject(err); }
      });
    }).on('error', reject);
  });
}

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const url = 'https://result.election.gov.np/JSONFiles/ElectionResultCentral2082.txt';
  const data = await fetch(url);
  const first = data[0];
  
  console.log('Sample data from URL:', JSON.stringify(first, null, 2));
  
  // Try inserting just this one
  try {
    const candidate = new Candidate({
      personalInfo: {
        fullName: first.CandidateName || '',
        gender: first.Gender || '',
        contactNumber: first.ContactNumber || '',
        fatherName: first.FATHER_NAME || '',
        address: first.ADDRESS || '',
        profilePhoto: first.ImageURL || '',
        district: first.DistrictName || ''
      },
      politicalInfo: {
        partyName: first.PoliticalPartyName || '',
        constituency: first.ConstName || ''
      },
      education: {
        highestQualification: first.QUALIFICATION || ''
      },
      professionalExperience: {
        previousExperience: first.EXPERIENCE || ''
      },
      isActive: true,
      rawSource: first
    });
    await candidate.save();
    console.log('✅ Election data candidate saved');
  } catch (err) {
    console.error('❌ Save error:', err.message);
  }
  
  process.exit(0);
}).catch(err => { console.error('Error:', err); process.exit(1); });
