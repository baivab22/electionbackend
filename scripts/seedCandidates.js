const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const Candidate = require('../models/Candidate');

function safeParseDate(s) {
  if (!s || s === '---' || s === '-' || s === null) return null;
  // Try ISO parse
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d;
}

function slugifyName(name) {
  if (!name) return 'candidate';
  return name
    .toString()
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9\s.-]/g, '')
    .trim()
    .replace(/\s+/g, '.')
    .toLowerCase();
}

async function run(options = { run: false }) {
  const dataPath = path.join(__dirname, '..', 'data', 'nepali_candidates.json');
  if (!fs.existsSync(dataPath)) {
    console.error('Data file not found:', dataPath);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const arrKey = Object.keys(raw)[0];
  const items = raw[arrKey];
  if (!Array.isArray(items)) {
    console.error('Unexpected data format in', dataPath);
    process.exit(1);
  }

  const docs = items.map((it, i) => {
    const name = it['उम्मेदवारको नाम, थर'] || it['नाम'] || `Candidate ${i + 1}`;
    const constituency = it['निर्वाचन क्षेत्र'] || it['constituency'] || 'N/A';
    const province = it['प्रदेश'] || it['province'] || 'N/A';
    const contact = it['सम्पर्क नं.'] || it['सम्पर्क नं'] || it['contact'] || '';
    const dobRaw = it['जन्म मिति'] || it['birth_date'] || null;
    const dob = safeParseDate(dobRaw);

    const email = `${slugifyName(name)}.${i + 1}@placeholder.local`;

    const obj = {
      personalInfo: {
        fullName: name,
        fullName_np: name,
        dateOfBirth: dob || new Date('1970-01-01'),
        dateOfBirth_raw: dobRaw || null,
        contactNumber: contact || 'N/A',
        email,
        gender: 'Other'
      },
      politicalInfo: {
        partyName: 'Nepali Communist Party',
        partyName_np: 'नेपाली कम्युनिष्ट पार्टी',
        constituency: constituency,
        candidacyLevel: province && province !== 'N/A' ? 'Provincial' : 'Local'
      },
      // Required by updated model
      electionYear: process.env.ELECTION_YEAR || new Date().getFullYear().toString(),
      electionType: process.env.ELECTION_TYPE || 'General'
    };

    return obj;
  });

  if (!options.run) {
    console.log('Dry run: will create', docs.length, 'candidate documents.');
    console.log('Showing first 5 mapped documents:');
    console.log(JSON.stringify(docs.slice(0, 5), null, 2));
    console.log('\nTo actually insert into MongoDB Atlas set environment variable MONGODB_URI and run with `--run` flag.');
    return;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI is not set in environment. Aborting insert.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB.');

  // Insert with basic duplicate checks (by name + constituency)
  let inserted = 0;
  for (const doc of docs) {
    try {
      const exists = await Candidate.findOne({
        'personalInfo.fullName': doc.personalInfo.fullName,
        'politicalInfo.constituency': doc.politicalInfo.constituency
      });
      if (exists) {
        console.log(`Skipping existing: ${doc.personalInfo.fullName} - ${doc.politicalInfo.constituency}`);
        continue;
      }
      await Candidate.create(doc);
      inserted++;
      if (inserted % 50 === 0) console.log(`Inserted ${inserted}…`);
    } catch (err) {
      console.error('Error inserting document for', doc.personalInfo.fullName, err.message);
    }
  }

  console.log('Done. Inserted', inserted, 'documents.');
  await mongoose.disconnect();
}

// CLI
const args = process.argv.slice(2);
const runFlag = args.includes('--run');

run({ run: runFlag }).catch(err => {
  console.error(err);
  process.exit(1);
});
