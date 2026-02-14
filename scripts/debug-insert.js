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
  
  // Test with just first 50
  const docs = data.slice(0, 50).map(item => ({
    personalInfo: {
      fullName: item.CandidateName || 'Unknown'
    },
    politicalInfo: {
      partyName: item.PoliticalPartyName || ''
    },
    isActive: true,
    rawSource: item
  }));
  
  // Clear first
  await Candidate.deleteMany({});
  
  console.log('Testing insertMany with', docs.length, 'documents');
  
  const result = await Candidate.insertMany(docs, { ordered: false });
  console.log('Result type:', typeof result);
  console.log('Result is array:', Array.isArray(result));
  console.log('Result length:', result ? result.length : 'null');
  console.log('Result:', result);
  
  const count = await Candidate.countDocuments();
  console.log('Total in DB after insert:', count);
  
  process.exit(0);
}).catch(err => { console.error('Error:', err.message); process.exit(1); });
