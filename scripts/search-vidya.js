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
    // Search for "विदया वारिणी" in all fields
    const results = await Candidate.find({
      $or: [
        { 'education.highestQualification': /विदया|वारिणी/ },
        { 'education.highestQualification_np': /विदया|वारिणी/ },
        { 'education.subject': /विदया|वारिणी/ },
        { 'education.subject_np': /विदया|वारिणी/ }
      ]
    }).limit(5);
    
    console.log(`\n📚 Found ${results.length} candidates with similar text`);
    results.forEach((c, i) => {
      console.log(`\nCandidate ${i + 1}: ${c.personalInfo?.fullName}`);
      console.log('  highestQualification:', c.education?.highestQualification);
      console.log('  highestQualification_np:', c.education?.highestQualification_np);
      console.log('  subject:', c.education?.subject);
      console.log('  subject_np:', c.education?.subject_np);
    });
    
    // Also check rawSource for any सामा related text
    const rawSourceResults = await Candidate.find({
      'rawSource.QUALIFICATION': /विदया|वारिणी/
    }).limit(5);
    
    console.log(`\n📚 Found ${rawSourceResults.length} candidates with text in rawSource.QUALIFICATION`);
    rawSourceResults.forEach((c, i) => {
      console.log(`\nCandidate ${i + 1}: ${c.personalInfo?.fullName}`);
      console.log('  rawSource.QUALIFICATION:', c.rawSource?.QUALIFICATION);
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
