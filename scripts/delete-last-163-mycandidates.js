// Script to delete the last 163 inserted candidates from mynewcandidate collection
// Usage: node delete-last-163-mycandidates.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not found in environment variables');
  process.exit(1);
}
const MyNewCandidate = require('../models/MyNewCandidate');

async function main() {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
    // Find the last 163 inserted documents (by _id descending)
    const last163 = await MyNewCandidate.find().sort({ _id: -1 }).limit(163);
    const idsToDelete = last163.map(doc => doc._id);
    const result = await MyNewCandidate.deleteMany({ _id: { $in: idsToDelete } });
    console.log('Deleted', result.deletedCount, 'documents from mynewcandidate collection');
  } catch (err) {
    console.error('Delete failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  }
}

main();
