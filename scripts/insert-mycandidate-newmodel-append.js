// Script to insert mycandidate.json into mynewcandidate collection using the new model (no deleteMany)
// Usage: node insert-mycandidate-newmodel-append.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not found in environment variables');
  process.exit(1);
}
const dataPath = path.join(__dirname, '/../data/mycandidate.json');
const MyNewCandidate = require('../models/MyNewCandidate');

async function main() {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    if (!Array.isArray(data)) throw new Error('JSON is not an array');
    await MyNewCandidate.insertMany(data);
    console.log('Inserted', data.length, 'documents from mycandidate.json into mynewcandidate collection using new model');
  } catch (err) {
    console.error('Insert failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  }
}

main();
