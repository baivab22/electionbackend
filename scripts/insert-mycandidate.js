// Standalone script to insert mycandidate.json into mynewcandidate collection
// Usage: node insert-mycandidate.js

const mongoose = require('mongoose');
const fs = require('fs');

const uri = 'mongodb://localhost:27017/nekapa';
const dataPath = __dirname + '/../data/mycandidate.json';

const candidateSchema = new mongoose.Schema({}, { strict: false });
const Candidate = mongoose.model('mynewcandidate', candidateSchema);

async function main() {
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  if (!Array.isArray(data)) throw new Error('JSON is not an array');
  await Candidate.deleteMany({}); // Optional: clear collection first
  await Candidate.insertMany(data);
  console.log('Inserted', data.length, 'documents into mynewcandidate collection');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Insert failed:', err);
  process.exit(1);
});
