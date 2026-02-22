const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/nekapa';
const filePath = path.join(__dirname, '../data/samanupatiklist.json');

const Candidate = require('../models/Candidate');

async function main() {
  await mongoose.connect(MONGO_URI);
  let raw = fs.readFileSync(filePath, 'utf-8');
  try {
    // Remove trailing commas and fix JSON if needed
    raw = raw.replace(/,\s*([}\]])/g, '$1');
    const data = JSON.parse(raw);
    if (!Array.isArray(data) || !data.length) {
      console.error('No data found in samanupatiklist.json');
      process.exit(1);
    }
    await Candidate.insertMany(data);
    console.log(`Inserted ${data.length} records into 'mynewcandidate' collection.`);
  } catch (err) {
    if (err instanceof SyntaxError) {
      const pos = err.message.match(/position (\d+)/);
      if (pos) {
        const idx = parseInt(pos[1], 10);
        const context = raw.substring(Math.max(0, idx - 40), idx + 40);
        console.error('JSON parse error context:', context);
      }
    }
    throw err;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
