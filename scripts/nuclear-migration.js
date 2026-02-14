require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Candidate = require('../models/Candidate');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/election-app';
console.log('Using MongoDB URI:', MONGO_URI.substring(0, 50) + '...');

async function nuclearCleanMigration() {
  let connection = null;
  try {
    console.log('\n🔥 NUCLEAR CLEAN MIGRATION - Complete Database Reset & Import');
    console.log('═'.repeat(70));
    console.log(`📅 Timestamp: ${new Date().toISOString()}\n`);

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    connection = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // STEP 1: DELETE ALL CANDIDATES
    console.log('🗑️  STEP 1: Deleting ALL candidates from database...');
    const allCandidatesCount = await Candidate.countDocuments();
    console.log(`   Total candidates before deletion: ${allCandidatesCount}`);
    
    const deleteResult = await Candidate.deleteMany({});
    console.log(`   ✅ Deleted: ${deleteResult.deletedCount} candidates`);
    
    const checkAfterDelete = await Candidate.countDocuments();
    console.log(`   ✅ Database now has: ${checkAfterDelete} candidates\n`);

    // STEP 2: READ DATA FILE
    console.log('📖 STEP 2: Reading data from nepali_candidates.json...');
    const dataFilePath = path.join(__dirname, '../data/nepali_candidates.json');
    
    if (!fs.existsSync(dataFilePath)) {
      throw new Error(`Data file not found: ${dataFilePath}`);
    }

    const rawData = fs.readFileSync(dataFilePath, 'utf-8');
    const dataObject = JSON.parse(rawData);
    
    // Extract candidates array from the nested structure
    const allCandidatesData = [];
    Object.keys(dataObject).forEach((key) => {
      if (Array.isArray(dataObject[key])) {
        allCandidatesData.push(...dataObject[key]);
      }
    });

    console.log(`   ✅ Found ${allCandidatesData.length} candidates in file\n`);

    // STEP 3: TRANSFORM DATA
    console.log('🔄 STEP 3: Transforming data to database schema...');
    
    const transformedCandidates = allCandidatesData.map((candidate, index) => {
      const fullName = candidate['उम्मेदवारको नाम, थर'] || `Candidate ${index + 1}`;
      const dobString = candidate['जन्म मिति'] || '';
      const contactNumber = candidate['सम्पर्क नं.'] || '';
      const constituency = candidate['निर्वाचन क्षेत्र'] || 'Unknown';
      const state = candidate['प्रदेश'] || 'Unknown Province';

      // Parse DOB
      let dateOfBirth = null;
      if (dobString) {
        try {
          dateOfBirth = new Date(dobString);
          if (isNaN(dateOfBirth.getTime())) {
            dateOfBirth = null;
          }
        } catch (e) {
          dateOfBirth = null;
        }
      }

      return {
        personalInfo: {
          fullName: fullName,
          fullName_np: fullName,
          nickname: '',
          nickname_np: '',
          dateOfBirth: dateOfBirth,
          dateOfBirth_raw: dobString,
          gender: 'Male', // Default, can be updated manually
          maritalStatus: '',
          permanentAddress: `${constituency}, ${state}`,
          currentAddress: `${constituency}, ${state}`,
          citizenshipNumber: '',
          citizenshipIssuedDistrict: '',
          contactNumber: contactNumber,
          email: '',
          website: '',
          profilePhoto: '',
          position: '', // Will be set later
        },
        politicalInfo: {
          partyName: 'नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)',
          partyName_np: 'नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)',
          currentPosition: '',
          currentPosition_np: '',
          candidacyLevel: 'Parliamentary',
          candidacyLevel_np: 'संसदीय',
          constituencyNumber: String(candidate['क्र'] || index + 1),
          constituency: constituency,
          constituency_np: constituency,
          electionSymbol: 'सुर्य',
          electionSymbol_np: 'सुर्य',
          electionSymbolImage: '',
          isFirstTimeCandidate: false,
          previousElectionHistory: '',
        },
        education: {
          highestQualification: '',
          highestQualification_np: '',
          subject: '',
          subject_np: '',
          institution: '',
          institution_np: '',
          country: 'Nepal',
          country_np: 'नेपाल',
          additionalTraining: '',
        },
        professionalExperience: {
          currentProfession: '',
          currentProfession_np: '',
          previousExperience: '',
          previousExperience_np: '',
          organizationResponsibility: '',
          organizationResponsibility_np: '',
          leadershipExperience: '',
        },
        politicalExperience: {
          partyJoinYear: '',
          movementRole: '',
          movementRole_np: '',
          previousRepresentativePosition: '',
          previousRepresentativePosition_np: '',
          majorAchievements: '',
        },
        socialEngagement: {
          ngoInvolvement: '',
          ngoInvolvement_np: '',
          sectorWork: '',
          sectorWork_np: '',
          awardsHonors: '',
        },
        financialInfo: {
          movableAssets: '',
          immovableAssets: '',
          annualIncomeSource: '',
          bankLoans: '',
          taxStatus: '',
        },
        legalStatus: {
          hasCriminalCase: false,
          caseDetails: '',
          eligibilityDeclaration: '',
        },
        biography: {
          bio_en: `Candidate from ${constituency}, ${state}`,
          bio_np: `${constituency} मा रहेका उम्मेदवार`,
          backgroundEducation: 'Educational background will be updated',
          experience: 'Professional experience will be updated',
        },
        manifesto: {
          title_en: 'Election Manifesto',
          title_np: 'चुनावी घोषणापत्र',
          content_en: 'Manifesto details will be updated',
          content_np: 'घोषणापत्रको विवरण आपडेट गरिनेछ',
          manifestoBrochure: '',
        },
        visionGoals: {
          visionStatement: '',
          visionStatement_np: '',
          majorGoals: '',
          majorGoals_np: '',
          developmentPriorities: '',
          developmentPriorities_np: '',
        },
        socialMedia: {
          facebook: '',
          twitter: '',
          instagram: '',
          youtube: '',
          linkedin: '',
          tiktok: '',
          website: '',
          email: '',
        },
        campaign: {
          campaignFocus: '',
          campaignFocus_np: '',
          keyMessages: '',
          keyMessages_np: '',
          targetAudience: '',
          targetAudience_np: '',
          campaignSlogan_en: '',
          votingTarget: 0,
        },
        documents: {
          manifestoBrochure: '',
          affidavit: '',
          citizenship: '',
          declaration: '',
        },
        issues: [
          {
            issueTitle_en: 'Education Reform',
            issueTitle_np: 'शिक्षा सुधार',
            issueDescription_en: 'Improving the education system',
            issueDescription_np: 'शिक्षा प्रणालीमा सुधार',
            issueCategory: 'Education',
            priority: 1,
          },
        ],
        achievements: [
          {
            achievementTitle_en: 'Community Service',
            achievementTitle_np: 'सामुदायिक सेवा',
            achievementDescription_en: 'Dedicated to serving the community',
            achievementDescription_np: 'समुदायको सेवामा समर्पित',
            achievementDate: new Date(),
            achievementCategory: 'Service',
            achievementImage: '',
          },
        ],
        comments: [],
        likes: 0,
        shares: 0,
        votes: 0,
        votePercentage: 0,
        votingEnabled: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    console.log(`   ✅ Transformed ${transformedCandidates.length} candidates\n`);

    // STEP 4: INSERT INTO DATABASE
    console.log('📥 STEP 4: Inserting candidates into database...');
    const insertResult = await Candidate.insertMany(transformedCandidates);
    console.log(`   ✅ Successfully inserted: ${insertResult.length} candidates\n`);

    // STEP 5: VERIFY
    console.log('✅ STEP 5: Verifying data integrity...');
    const verifyCount = await Candidate.countDocuments();
    console.log(`   ✅ Database now contains: ${verifyCount} candidates`);
    
    const sampleCandidates = await Candidate.find().limit(3);
    console.log(`   ✅ Sample candidates loaded successfully\n`);

    // SUMMARY
    console.log('═'.repeat(70));
    console.log('✨ MIGRATION COMPLETE');
    console.log('═'.repeat(70));
    console.log(`Total Deleted: ${deleteResult.deletedCount}`);
    console.log(`Total Inserted: ${insertResult.length}`);
    console.log(`Current Database Count: ${verifyCount}`);
    console.log(`Status: ${'✅ SUCCESS'}`);
    console.log('═'.repeat(70));

    console.log('\nSample candidates:');
    sampleCandidates.forEach((candidate, index) => {
      console.log(`\n${index + 1}. ${candidate.personalInfo.fullName}`);
      console.log(`   Constituency: ${candidate.politicalInfo.constituency}`);
      console.log(`   Contact: ${candidate.personalInfo.contactNumber}`);
      console.log(`   DOB: ${candidate.personalInfo.dateOfBirth_raw}`);
    });

    console.log('\n✅ All candidates ready for frontend!\n');

  } catch (error) {
    console.error('\n❌ ERROR during migration:');
    console.error('─'.repeat(70));
    console.error(error.message);
    console.error('─'.repeat(70), '\n');
    process.exit(1);
  } finally {
    if (connection) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed\n');
      process.exit(0);
    }
  }
}

// Run migration
nuclearCleanMigration();
