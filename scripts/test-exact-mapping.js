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
  
  // Clear
  await Candidate.deleteMany({});
  
  // Use exact mapping from full script
  const importedCandidates = [];
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const item = data[i];
    
    const candidateObj = {
      candidateId: item.CandidateID?.toString() || '',
      personalInfo: {
        fullName: item.CandidateName || 'Unknown',
        gender: item.Gender || '',
        dateOfBirth: item.DOB ? new Date(item.DOB) : null,
        contactNumber: item.ContactNumber || '',
        fatherName: item.FATHER_NAME || '',
        address: item.ADDRESS || '',
        profilePhoto: item.ImageURL || '',
        district: item.DistrictName || ''
      },
      politicalInfo: {
        partyName: item.PoliticalPartyName || '',
        constituency: item.ConstName || ''
      },
      education: {
        highestQualification: item.QUALIFICATION || ''
      },
      professionalExperience: {
        previousExperience: item.EXPERIENCE || ''
      },
      isActive: true,
      rawSource: item
    };
    
    importedCandidates.push(candidateObj);
  }
  
  console.log('Sample object:', JSON.stringify(importedCandidates[0], null, 2));
  
  const result = await Candidate.insertMany(importedCandidates, { ordered: false });
  console.log('Result length:', result.length);
  console.log('Result is array:', Array.isArray(result));
  
  const count = await Candidate.countDocuments();
  console.log('Total in DB:', count);
  
  process.exit(0);
}).catch(err => { console.error('Error:', err.message); process.exit(1); });
