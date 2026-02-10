const mongoose = require('mongoose');
require('dotenv').config();
const Candidate = require('../models/Candidate');

/**
 * Script to remove appended age values from contact numbers
 * Fixes contact numbers like "9841234567-25" to "9841234567"
 */

async function fixContactNumbers() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI is not set in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('Connected to MongoDB');

    // Find all candidates
    const candidates = await Candidate.find();
    console.log(`Found ${candidates.length} candidates`);

    let updatedCount = 0;
    const issuesFound = [];

    for (const candidate of candidates) {
      if (!candidate.personalInfo || !candidate.personalInfo.contactNumber) {
        continue;
      }

      const originalNumber = candidate.personalInfo.contactNumber;
      
      // Pattern to match contact numbers with appended age values
      // Matches patterns like: 9841234567-25, 9841234567 25, 9841234567_25, etc.
      const patterns = [
        /^(\d+)\s*[-_]\s*(\d{1,3})$/, // "9841234567-25" or "9841234567 - 25"
        /^(\d+)\s+(\d{1,3})$/, // "9841234567 25"
        /^(\+?\d{1,3}\s?\d{3,4}\s?\d{4,})[-_\s]+(\d{1,3})$/, // International format with age
      ];

      let cleanedNumber = originalNumber;
      let wasModified = false;

      for (const pattern of patterns) {
        const match = originalNumber.match(pattern);
        if (match) {
          const potentialNumber = match[1];
          const potentialAge = match[2];
          
          // Validate that the second part looks like an age (1-150)
          const ageValue = parseInt(potentialAge, 10);
          if (ageValue > 0 && ageValue <= 150) {
            cleanedNumber = potentialNumber.trim();
            wasModified = true;
            break;
          }
        }
      }

      if (wasModified) {
        issuesFound.push({
          candidateName: candidate.personalInfo.fullName,
          original: originalNumber,
          cleaned: cleanedNumber
        });

        candidate.personalInfo.contactNumber = cleanedNumber;
        await candidate.save();
        updatedCount++;
        console.log(`✓ Updated: ${candidate.personalInfo.fullName}`);
        console.log(`  From: ${originalNumber}`);
        console.log(`  To:   ${cleanedNumber}\n`);
      }
    }

    console.log(`\n==== Summary ====`);
    console.log(`Total candidates processed: ${candidates.length}`);
    console.log(`Contact numbers cleaned: ${updatedCount}`);
    
    if (issuesFound.length > 0) {
      console.log(`\nDetails of changes:`);
      issuesFound.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.candidateName}`);
        console.log(`   Before: ${issue.original}`);
        console.log(`   After:  ${issue.cleaned}`);
      });
    }

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
fixContactNumbers();
