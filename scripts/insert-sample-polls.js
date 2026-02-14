/**
 * This script creates sample election polls with demo data
 * Run: node insert-sample-polls.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Poll = require('../models/Poll');

const MONGO_URI = process.env.MONGO_URL || 'mongodb://localhost:27017/election-app';

const samplePolls = [
  {
    title: 'Which party will lead Nepal in the next election?',
    description: 'Share your prediction on which political party will emerge as the leading force in Nepal\'s upcoming election.',
    choices: [
      { label: 'नेपाली कम्युनिष्ट पार्टी (NCP)', votesCount: 3245 },
      { label: 'नेपाली कांग्रेस (NC)', votesCount: 2891 },
      { label: 'राप्रपा', votesCount: 1250 },
      { label: 'अन्य पार्टी', votesCount: 765 }
    ],
    startAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Started 7 days ago
    endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Ending in 30 days
    isActive: true,
    allowAnonymous: true,
    maxVotesPerVoter: 1
  },
  {
    title: 'What is your top priority for Nepal\'s development?',
    description: 'Choose what you think should be the government\'s main focus in the coming years.',
    choices: [
      { label: 'शिक्षा (Education)', votesCount: 1850 },
      { label: 'स्वास्थ्य सेवा (Healthcare)', votesCount: 2100 },
      { label: 'अर्थव्यवस्था (Economy)', votesCount: 3340 },
      { label: 'बुनियादी ढाँचा (Infrastructure)', votesCount: 2290 },
      { label: 'वातावरण (Environment)', votesCount: 890 }
    ],
    startAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Started 14 days ago
    endAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // Ending in 21 days
    isActive: true,
    allowAnonymous: true,
    maxVotesPerVoter: 1
  },
  {
    title: 'Do you support federal democratic system in Nepal?',
    description: 'Share your opinion on Nepal\'s federal democratic structure.',
    choices: [
      { label: 'पूर्ण समर्थन (Strongly Support)', votesCount: 4123 },
      { label: 'समर्थन (Support)', votesCount: 2890 },
      { label: 'तटस्थ (Neutral)', votesCount: 1245 },
      { label: 'असमर्थन (Oppose)', votesCount: 675 },
      { label: 'पूर्ण असमर्थन (Strongly Oppose)', votesCount: 432 }
    ],
    startAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // Started 21 days ago
    endAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Ending in 14 days
    isActive: true,
    allowAnonymous: true,
    maxVotesPerVoter: 1
  },
  {
    title: 'Which economic sector should Nepal focus on most?',
    description: 'Choose the sector that you believe will drive Nepal\'s economic growth.',
    choices: [
      { label: 'पर्यटन (Tourism)', votesCount: 2560 },
      { label: 'कृषि (Agriculture)', votesCount: 3120 },
      { label: 'जल विद्युत (Hydroelectric Power)', votesCount: 4870 },
      { label: 'तकनीकी उद्योग (Technology)', votesCount: 2890 },
      { label: 'वर्चुअल बैंकिङ (Digital Finance)', votesCount: 1845 }
    ],
    startAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Started 3 days ago
    endAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // Ending in 45 days
    isActive: true,
    allowAnonymous: true,
    maxVotesPerVoter: 1
  }
];

async function insertSamplePolls() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✓ Connected to MongoDB');

    // Clear existing polls (optional - comment out if you want to keep existing)
    // await Poll.deleteMany({});
    // console.log('✓ Cleared existing polls');

    // Insert sample polls
    const insertedPolls = await Poll.insertMany(samplePolls);
    
    console.log('\n✅ Sample polls created successfully!\n');
    console.log('📊 Polls inserted:');
    insertedPolls.forEach((poll, index) => {
      const totalVotes = poll.choices.reduce((sum, choice) => sum + (choice.votesCount || 0), 0);
      console.log(`\n${index + 1}. ${poll.title}`);
      console.log(`   ID: ${poll._id}`);
      console.log(`   Total Votes: ${totalVotes}`);
      console.log(`   Active: ${poll.isActive}`);
      console.log('   Choices:');
      poll.choices.forEach(choice => {
        const percentage = totalVotes > 0 ? ((choice.votesCount / totalVotes) * 100).toFixed(1) : 0;
        console.log(`     • ${choice.label}: ${choice.votesCount} votes (${percentage}%)`);
      });
    });

    console.log('\n✨ All polls are ready for demo!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error inserting sample polls:', error);
    process.exit(1);
  }
}

// Run the script
insertSamplePolls();
