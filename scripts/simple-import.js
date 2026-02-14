const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Candidate = require('../models/Candidate');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sandipbidari007_db_user:GfS3lzMMgYKQGA5i@cluster0.9fhie0j.mongodb.net/election';

async function importCandidates() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected!');

    const dataFilePath = path.join(__dirname, '../../client/src/constants/data.constant.txt');
    console.log(`📖 Reading: ${dataFilePath}`);
    
    const rawData = fs.readFileSync(dataFilePath, 'utf8');
    const data = JSON.parse(rawData);
    
    console.log(`📊 Found ${data.length} candidates`);
    console.log('💾 Importing to database...');

    // Insert data directly
    await Candidate.insertMany(data.map(item => ({
      personalInfo: {
        fullName: item.CandidateName
      },
      politicalInfo: {
        partyName: item.PoliticalPartyName,
        constituency: item.ConstName
      },
      rawSource: item
    })));

    const count = await Candidate.countDocuments();
    console.log(`✅ Imported ${count} candidates\n`);

    // Show first and last
    const first = await Candidate.findOne().sort({ _id: 1 });
    const last = await Candidate.findOne().sort({ _id: -1 });
    
    console.log(`First: ${first.personalInfo.fullName}`);
    console.log(`Last: ${last.personalInfo.fullName}`);
    console.log(`\n✅ Complete!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

importCandidates();
