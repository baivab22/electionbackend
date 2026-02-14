#!/usr/bin/env node

/**
 * Easy tool to add custom polls to the election app
 * Usage: node add-custom-poll.js
 */

const mongoose = require('mongoose');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Poll = require('../models/Poll');
const MONGO_URI = process.env.MONGO_URL || 'mongodb://localhost:27017/election-app';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

const NEPAL_ELECTION_TEMPLATES = {
  1: {
    title: 'Which party will lead Nepal in the next election?',
    description: 'Share your prediction on which political party will emerge as the leading force in Nepal\'s upcoming election.',
    choices: [
      { label: 'नेपाली कम्युनिष्ट पार्टी (NCP)', votesCount: Math.floor(Math.random() * 5000) },
      { label: 'नेपाली कांग्रेस (NC)', votesCount: Math.floor(Math.random() * 4000) },
      { label: 'राप्रपा', votesCount: Math.floor(Math.random() * 2000) },
      { label: 'अन्य पार्टी', votesCount: Math.floor(Math.random() * 1000) }
    ]
  },
  2: {
    title: 'What is your top priority for Nepal\'s development?',
    description: 'Choose what you think should be the government\'s main focus in the coming years.',
    choices: [
      { label: 'शिक्षा (Education)', votesCount: Math.floor(Math.random() * 3000) },
      { label: 'स्वास्थ्य सेवा (Healthcare)', votesCount: Math.floor(Math.random() * 3000) },
      { label: 'अर्थव्यवस्था (Economy)', votesCount: Math.floor(Math.random() * 4000) },
      { label: 'बुनियादी ढाँचा (Infrastructure)', votesCount: Math.floor(Math.random() * 3000) },
      { label: 'वातावरण (Environment)', votesCount: Math.floor(Math.random() * 1500) }
    ]
  },
  3: {
    title: 'Do you support federal democratic system in Nepal?',
    description: 'Share your opinion on Nepal\'s federal democratic structure.',
    choices: [
      { label: 'पूर्ण समर्थन (Strongly Support)', votesCount: Math.floor(Math.random() * 5000) },
      { label: 'समर्थन (Support)', votesCount: Math.floor(Math.random() * 4000) },
      { label: 'तटस्थ (Neutral)', votesCount: Math.floor(Math.random() * 2000) },
      { label: 'असमर्थन (Oppose)', votesCount: Math.floor(Math.random() * 1000) },
      { label: 'पूर्ण असमर्थन (Strongly Oppose)', votesCount: Math.floor(Math.random() * 500) }
    ]
  }
};

async function main() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('\n🗳️  Nepal Election Polls - Quick Add Tool\n');
    console.log('Choose an option:');
    console.log('1. Use template (quick)');
    console.log('2. Create custom poll');
    console.log('3. Exit\n');

    const choice = await question('Your choice (1-3): ');

    if (choice === '1') {
      await addFromTemplate();
    } else if (choice === '2') {
      await addCustomPoll();
    } else {
      console.log('\nGoodbye! 👋\n');
      rl.close();
      process.exit(0);
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

async function addFromTemplate() {
  console.log('\n📋 Available Templates:\n');
  Object.entries(NEPAL_ELECTION_TEMPLATES).forEach(([key, poll]) => {
    console.log(`${key}. ${poll.title}`);
  });

  const templateNum = await question('\nChoose template (1-3): ');
  const template = NEPAL_ELECTION_TEMPLATES[templateNum];

  if (!template) {
    console.log('❌ Invalid choice');
    rl.close();
    process.exit(1);
  }

  const daysActive = await question('Days until poll closes (default 30): ') || '30';
  
  const poll = await Poll.create({
    ...template,
    startAt: new Date(),
    endAt: new Date(Date.now() + parseInt(daysActive) * 24 * 60 * 60 * 1000),
    isActive: true,
    allowAnonymous: true,
    maxVotesPerVoter: 1
  });

  console.log('\n✅ Poll created successfully!\n');
  console.log(`📌 ID: ${poll._id}`);
  console.log(`📋 Title: ${poll.title}`);
  
  const totalVotes = poll.choices.reduce((sum, c) => sum + (c.votesCount || 0), 0);
  console.log(`📊 Total Votes: ${totalVotes}`);
  console.log('\nOptions:');
  poll.choices.forEach(choice => {
    const percentage = totalVotes > 0 ? ((choice.votesCount / totalVotes) * 100).toFixed(1) : 0;
    console.log(`  • ${choice.label}: ${choice.votesCount} votes (${percentage}%)`);
  });

  console.log('\n✨ Ready to display on home page!\n');
  rl.close();
  process.exit(0);
}

async function addCustomPoll() {
  console.log('\n✍️  Create Custom Poll\n');

  const title = await question('Poll question: ');
  const description = await question('Description (optional): ') || 'Share your opinion';

  console.log('\n📝 Add choices (minimum 2). Type "done" when finished:\n');

  const choices = [];
  let index = 1;

  while (true) {
    const label = await question(`Choice ${index}: `);
    if (label.toLowerCase() === 'done') break;

    const votesStr = await question('Initial votes (default 0): ') || '0';
    const votes = parseInt(votesStr);

    choices.push({
      label,
      votesCount: votes
    });

    index++;
  }

  if (choices.length < 2) {
    console.log('❌ Need at least 2 choices');
    rl.close();
    process.exit(1);
  }

  const daysActive = await question('\nDays until poll closes (default 30): ') || '30';

  const poll = await Poll.create({
    title,
    description,
    choices,
    startAt: new Date(),
    endAt: new Date(Date.now() + parseInt(daysActive) * 24 * 60 * 60 * 1000),
    isActive: true,
    allowAnonymous: true,
    maxVotesPerVoter: 1
  });

  console.log('\n✅ Custom poll created successfully!\n');
  console.log(`📌 ID: ${poll._id}`);
  console.log(`📋 Title: ${poll.title}`);

  const totalVotes = poll.choices.reduce((sum, c) => sum + (c.votesCount || 0), 0);
  console.log(`📊 Total Votes: ${totalVotes}`);
  console.log('\nOptions:');
  poll.choices.forEach(choice => {
    const percentage = totalVotes > 0 ? ((choice.votesCount / totalVotes) * 100).toFixed(1) : 0;
    console.log(`  • ${choice.label}: ${choice.votesCount} votes (${percentage}%)`);
  });

  console.log('\n✨ Ready to display on home page!\n');
  rl.close();
  process.exit(0);
}

main();
