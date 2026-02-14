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
  
  console.log('Total records from URL:', data.length);
  
  // Test with just first 10
  const docs = data.slice(0, 10).map(item => ({
    personalInfo: {
      fullName: item.CandidateName || 'Unknown'
    },
    politicalInfo: {
      partyName: item.PoliticalPartyName || ''
    },
    isActive: true,
    rawSource: item
  }));
  
  console.log('Attempting insertMany with', docs.length, 'documents');
  
  try {
    const result = await Candidate.insertMany(docs, { ordered: false });
    console.log('✅ Inserted:', result.length);
  } catch (err) {
    console.error('❌ Insert error:', err.message);
  }
  
  const count = await Candidate.countDocuments();
  console.log('Total in DB:', count);
  
  process.exit(0);
}).catch(err => { console.error('Error:', err); process.exit(1); });
