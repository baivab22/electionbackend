// Script to import newCandidate (1).json into MongoDB mynewcandidate collection

const mongoose = require('mongoose');
const fs = require('fs');

const uri = 'mongodb://localhost:27017/nekapa'; // Update if needed
const Candidate = require('../models/Candidate'); // Correct path for script location

async function importCandidates() {
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  const data = JSON.parse(fs.readFileSync(__dirname + '/../data/mycandidate.json', 'utf8'));

  // Clean up collection first if needed
  // await Candidate.deleteMany({});

  for (const candidate of data) {
    await Candidate.create(candidate);
  }

  console.log('Import complete!');
  mongoose.disconnect();
}

importCandidates().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
