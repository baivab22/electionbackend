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
    // Get first candidate with rawSource
    const candidate = await Candidate.findOne({ rawSource: { $exists: true, $ne: {} } });
    
    if (candidate) {
      console.log('\n📋 Sample Candidate:', candidate.personalInfo?.fullName);
      console.log('📋 rawSource keys:');
      Object.keys(candidate.rawSource || {}).forEach(key => {
        console.log(`  - ${key}: ${candidate.rawSource[key]}`);
      });
    } else {
      console.log('❌ No candidates with rawSource found');
    }
    
    // Count candidates with rawSource
    const count = await Candidate.countDocuments({ rawSource: { $exists: true, $ne: {} } });
    console.log(`\n📊 Total candidates with rawSource: ${count}`);
    
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
