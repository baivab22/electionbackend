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
    // Array of all possible field paths to check
    const fieldsToUpdate = [
      { path: 'education.highestQualification', op: 'set' },
      { path: 'education.highestQualification_np', op: 'set' },
      { path: 'rawSource.QUALIFICATION', op: 'mongo' },
      { path: 'rawSource.Qualification', op: 'mongo' },
      { path: 'rawSource.qualification', op: 'mongo' }
    ];
    
    let totalUpdated = 0;
    
    // Update each field
    for (const field of fieldsToUpdate) {
      const query = {};
      query[field.path] = 'विदया वारिणी';
      
      const update = {};
      update[field.path] = 'विद्यावारिधि';
      
      const result = await Candidate.updateMany(query, { $set: update });
      totalUpdated += result.modifiedCount;
      
      if (result.modifiedCount > 0) {
        console.log(`📝 Updated ${result.modifiedCount} records in ${field.path}`);
      }
    }
    
    console.log(`\n✅ Total records updated: ${totalUpdated}`);
    
    if (totalUpdated === 0) {
      console.log('ℹ️  No records with "विदया वारिणी" found in the database.');
      console.log('This migration script will be applied to any future data imports containing this value.');
    }
    
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});
