const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Candidate = require('../models/Candidate');

// Database configuration
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/election-app';

// Political party filter
const TARGET_PARTY = 'नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)';

// Base URL for candidate photos
const PHOTO_BASE_URL = 'https://result.election.gov.np/Images/Candidate';

const dataFilePath = path.join(__dirname, '../../client/src/constants/data.constant.txt');
const backupFilePath = path.join(__dirname, `./migrate-backup-${Date.now()}.json`);

async function migrateCandidates() {
  let connection = null;
  try {
    console.log('\n🚀 Starting Candidate Migration Process...');
    console.log('═'.repeat(60));
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`🎯 Target Party: ${TARGET_PARTY}\n`);

    // Check if data file exists
    if (!fs.existsSync(dataFilePath)) {
      console.error(`❌ Data file not found: ${dataFilePath}`);
      process.exit(1);
    }

    const fileStats = fs.statSync(dataFilePath);
    if (fileStats.size === 0) {
      console.error(`❌ Data file is empty: ${dataFilePath}`);
      console.error(`\n📝 Please populate the data file with candidate JSON array.`);
      console.error(`   Run: node scripts/setup-data.js`);
      process.exit(1);
    }

    console.log(`📁 Reading data from: ${dataFilePath}`);
    console.log(`📊 File size: ${(fileStats.size / 1024).toFixed(2)} KB\n`);

    // Read the data file
    const rawData = fs.readFileSync(dataFilePath, 'utf-8');
    
    // Parse JSON
    let allCandidates;
    try {
      allCandidates = JSON.parse(rawData);
    } catch (parseError) {
      console.error(`❌ Failed to parse JSON: ${parseError.message}`);
      process.exit(1);
    }

    if (!Array.isArray(allCandidates)) {
      console.error('❌ Data must be a JSON array');
      process.exit(1);
    }

    console.log(`📊 Total candidates in file: ${allCandidates.length}`);

    // Filter candidates by political party
    const filteredCandidates = allCandidates.filter(
      (candidate) => candidate.PoliticalPartyName === TARGET_PARTY
    );
    console.log(`🎯 Filtered candidates: ${filteredCandidates.length}\n`);

    if (filteredCandidates.length === 0) {
      console.warn('⚠️  No candidates found for the target party');
      
      // Show available parties
      const parties = {};
      allCandidates.forEach(c => {
        parties[c.PoliticalPartyName] = (parties[c.PoliticalPartyName] || 0) + 1;
      });
      
      console.log('\n📋 Available political parties:');
      Object.entries(parties)
        .sort((a, b) => b[1] - a[1])
        .forEach(([party, count]) => {
          console.log(`  • ${party}: ${count} candidates`);
        });
      
      process.exit(1);
    }

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    connection = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Map candidates to database schema
    console.log('🔄 Mapping candidate data to database schema...');
    const mappedCandidates = filteredCandidates.map((candidate, index) => {
      try {
        // Calculate birth date (approximate from age)
        let dateOfBirth = null;
        if (candidate.DOB) {
          // DOB field seems to be age, create approximate date
          const currentYear = new Date().getFullYear();
          const birthYear = currentYear - candidate.DOB;
          dateOfBirth = new Date(birthYear, 0, 1);
        }

        return {
          personalInfo: {
            fullName: candidate.CandidateName || '',
            fullName_np: candidate.CandidateName || '',
            nickname: '',
            nickname_np: '',
            dateOfBirth: dateOfBirth,
            dateOfBirth_raw: candidate.DOB ? String(candidate.DOB) : null,
            gender: (candidate.Gender && candidate.Gender.toLowerCase() === 'महिला') ? 'Female' : 'Male',
            maritalStatus: '',
            permanentAddress: candidate.ADDRESS || '',
            currentAddress: candidate.ADDRESS || '',
            citizenshipNumber: '',
            citizenshipIssuedDistrict: candidate.CTZDIST || '',
            contactNumber: candidate['सम्पर्क नं.'] || '',
            email: '',
            website: '',
            profilePhoto: candidate.CandidateID 
              ? `${PHOTO_BASE_URL}/${candidate.CandidateID}.jpg`
              : ''
          },
          politicalInfo: {
            partyName: candidate.PoliticalPartyName || '',
            partyName_np: candidate.PoliticalPartyName || '',
            currentPosition: '',
            currentPosition_np: '',
            candidacyLevel: '',
            candidacyLevel_np: '',
            constituencyNumber: String(candidate.SCConstID || ''),
            constituency: candidate.DistrictName || '',
            constituency_np: candidate.DistrictName || '',
            electionSymbol: candidate.SymbolName || '',
            electionSymbol_np: candidate.SymbolName || '',
            electionSymbolImage: '',
            isFirstTimeCandidate: false,
            previousElectionHistory: ''
          },
          education: {
            highestQualification: candidate.QUALIFICATION || '',
            highestQualification_np: candidate.QUALIFICATION || '',
            subject: '',
            subject_np: '',
            institution: candidate.NAMEOFINST || '',
            institution_np: candidate.NAMEOFINST || '',
            country: '',
            country_np: '',
            additionalTraining: ''
          },
          professionalExperience: {
            currentProfession: '',
            currentProfession_np: '',
            previousExperience: candidate.EXPERIENCE || '',
            previousExperience_np: candidate.EXPERIENCE || '',
            organizationResponsibility: '',
            organizationResponsibility_np: '',
            leadershipExperience: ''
          },
          politicalExperience: {
            partyJoinYear: '',
            movementRole: '',
            movementRole_np: '',
            previousRepresentativePosition: '',
            previousRepresentativePosition_np: '',
            majorAchievements: candidate.OTHERDETAILS || ''
          },
          socialEngagement: {
            ngoInvolvement: '',
            ngoInvolvement_np: '',
            sectorWork: '',
            sectorWork_np: '',
            awardsHonors: ''
          },
          financialInfo: {
            movableAssets: '',
            immovableAssets: '',
            annualIncomeSource: '',
            bankLoans: '',
            taxStatus: ''
          },
          legalStatus: {
            hasCriminalCase: false,
            caseDetails: '',
            eligibilityDeclaration: ''
          },
          visionGoals: {
            visionStatement: '',
            visionStatement_np: '',
            majorGoals: '',
            majorGoals_np: '',
            developmentPriorities: '',
            developmentPriorities_np: ''
          },
          socialMedia: {
            facebook: '',
            twitter: '',
            instagram: '',
            website: '',
            email: ''
          },
          campaign: {
            campaignFocus: '',
            campaignFocus_np: '',
            keyMessages: '',
            keyMessages_np: '',
            targetAudience: '',
            targetAudience_np: ''
          },
          documents: {
            manifestoBrochure: '',
            affidavit: '',
            citizenship: '',
            declaration: ''
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      } catch (mapError) {
        console.error(`  ⚠️  Error mapping candidate #${index + 1}: ${candidate.CandidateName}`);
        throw mapError;
      }
    });

    console.log(`✅ Successfully mapped ${mappedCandidates.length} candidates\n`);

    // Backup existing candidates
    console.log('💾 Creating backup of existing candidates...');
    const existingCandidates = await Candidate.find({
      'politicalInfo.partyName': TARGET_PARTY
    });
    
    if (existingCandidates.length > 0) {
      fs.writeFileSync(
        backupFilePath,
        JSON.stringify(existingCandidates, null, 2),
        'utf-8'
      );
      console.log(`📦 Backup saved: ${backupFilePath}`);
      console.log(`   Records backed up: ${existingCandidates.length}\n`);
    }

    // Delete existing candidates
    console.log('🗑️  Deleting existing candidates from the database...');
    const deleteResult = await Candidate.deleteMany({
      'politicalInfo.partyName': TARGET_PARTY
    });
    console.log(`   Deleted records: ${deleteResult.deletedCount}\n`);

    // Insert new candidates
    console.log('📥 Inserting new candidates into the database...');
    const insertResult = await Candidate.insertMany(mappedCandidates, { ordered: false });
    console.log(`   Inserted records: ${insertResult.length}\n`);

    // Verify insertion
    console.log('✔️  Verifying migration...');
    const verifyCount = await Candidate.countDocuments({
      'politicalInfo.partyName': TARGET_PARTY
    });
    console.log(`   Database records: ${verifyCount}\n`);

    // Print summary
    console.log('═'.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Party: ${TARGET_PARTY}`);
    console.log(`Deleted: ${deleteResult.deletedCount}`);
    console.log(`Inserted: ${insertResult.length}`);
    console.log(`Verified: ${verifyCount}`);
    console.log(`Photo URL Format: ${PHOTO_BASE_URL}/{CandidateID}.jpg`);
    console.log('═'.repeat(60));

    // Show sample
    console.log('\n✨ Sample of inserted candidates:');
    const sample = await Candidate.find({ 
      'politicalInfo.partyName': TARGET_PARTY 
    }).limit(3);
    
    sample.forEach((candidate, index) => {
      console.log(`\n${index + 1}. ${candidate.personalInfo.fullName}`);
      console.log(`   Constituency: ${candidate.politicalInfo.constituency}`);
      console.log(`   Photo: ${candidate.personalInfo.profilePhoto}`);
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('═'.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Migration Error:');
    console.error('─'.repeat(60));
    console.error(error.message);
    console.error('─'.repeat(60), '\n');
    
    if (error.code === 'ENOENT') {
      console.error('📁 Data file not found. Please run: node scripts/setup-data.js');
    } else if (error instanceof SyntaxError) {
      console.error('📝 Invalid JSON in data file');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed\n');
    }
  }
}
}

// Run migration
migrateCandidates();
