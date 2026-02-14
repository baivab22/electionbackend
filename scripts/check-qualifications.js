const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/election-app';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('✅ Connected to MongoDB');
  
  try {
    // Get unique education qualifications
    const qualifications = await Candidate.distinct('education.highestQualification');
    console.log('\n📚 Unique Education Qualifications (highestQualification):');
    qualifications.forEach((q, i) => {
      console.log(`${i + 1}. "${q}"`);
    });
    
    // Get unique Nepali qualifications
    const qualificationsNp = await Candidate.distinct('education.highestQualification_np');
    console.log('\n📚 Unique Education Qualifications (highestQualification_np):');
    qualificationsNp.forEach((q, i) => {
      console.log(`${i + 1}. "${q}"`);
    });
    
    console.log('\n✅ Check complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});
