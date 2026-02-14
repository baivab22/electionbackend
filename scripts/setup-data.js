const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const dataFilePath = path.join(__dirname, '../../client/src/constants/data.constant.txt');
const backupPath = path.join(__dirname, '../../client/src/constants/data.constant.backup.json');

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n🔧 Candidate Data Migration Setup Tool');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const fileExists = fs.existsSync(dataFilePath);
  const fileSize = fileExists ? fs.statSync(dataFilePath).size : 0;
  
  console.log(`📁 Data file: ${dataFilePath}`);
  console.log(`📊 Current size: ${fileSize} bytes`);
  console.log(`✓ Exists: ${fileExists ? 'Yes' : 'No'}\n`);

  if (fileSize === 0) {
    console.log('⚠️  The data file is empty. You need to provide the candidate data.\n');
    console.log('Options:');
    console.log('1. Paste JSON data (will prompt for input)');
    console.log('2. Use sample data for testing');
    console.log('3. Exit\n');
    
    const choice = await question('Select option (1-3): ');
    
    if (choice === '1') {
      console.log('\n📝 Paste your JSON array data (press Enter twice when done):');
      let data = '';
      
      const pasteData = async () => {
        return new Promise((resolve) => {
          let emptyLineCount = 0;
          const lines = [];
          
          const readLine = () => {
            rl.question('', (line) => {
              if (line === '') {
                emptyLineCount++;
                if (emptyLineCount >= 2) {
                  resolve(lines.join('\n'));
                } else {
                  lines.push(line);
                  readLine();
                }
              } else {
                emptyLineCount = 0;
                lines.push(line);
                readLine();
              }
            });
          };
          readLine();
        });
      };
      
      data = await pasteData();
      
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          fs.writeFileSync(dataFilePath, data, 'utf-8');
          console.log(`\n✅ Data saved! File size: ${data.length} bytes`);
          console.log(`📊 Records in file: ${parsed.length}`);
          
          // Filter for target party
          const TARGET_PARTY = 'नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)';
          const filtered = parsed.filter(c => c.PoliticalPartyName === TARGET_PARTY);
          console.log(`🎯 Matching target party: ${filtered.length}`);
        } else {
          console.log('❌ Error: Data must be a JSON array');
        }
      } catch (error) {
        console.log(`❌ Error: Invalid JSON - ${error.message}`);
      }
    } else if (choice === '2') {
      console.log('\n⚠️  Sample data mode (limited data for testing)\n');
      
      const sampleData = [
        {
          "CandidateID": 339933,
          "CandidateName": "क्षितिज थेबे",
          "AGE_YR": 38,
          "Gender": "पुरुष",
          "PoliticalPartyName": "नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)",
          "SYMBOLCODE": 2598,
          "SymbolName": "सुर्य",
          "CTZDIST": 1,
          "DistrictName": "ताप्लेजुङ",
          "StateName": "कोशी प्रदेश",
          "STATE_ID": 1,
          "SCConstID": 1,
          "ConstName": 1,
          "QUALIFICATION": "स्नातक",
          "NAMEOFINST": "TU",
          "EXPERIENCE": "0",
          "ADDRESS": "ताप्लेजुङ सिरीजङ्घा गाउँपालिका मादिबुङ",
          "FATHER_NAME": "भुपेन्द्र  थेबे",
          "DOB": 38
        }
      ];
      
      fs.writeFileSync(dataFilePath, JSON.stringify(sampleData), 'utf-8');
      console.log('✅ Sample data created for testing');
    } else {
      console.log('👋 Exiting...');
      rl.close();
      return;
    }
  }

  // Verify the existing/newly created file
  console.log('\n📋 Verifying data file...\n');
  
  try {
    const rawData = fs.readFileSync(dataFilePath, 'utf-8');
    const parsed = JSON.parse(rawData);
    
    if (!Array.isArray(parsed)) {
      console.log('❌ Error: Data is not a JSON array');
      rl.close();
 return;
    }
    
    console.log(`✅ JSON is valid`);
    console.log(`📊 Total records: ${parsed.length}\n`);
    
    // Show distribution
    const TARGET_PARTY = 'नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)';
    const filtered = parsed.filter(c => c.PoliticalPartyName === TARGET_PARTY);
    
    console.log('Party Distribution:');
    const parties = {};
    parsed.forEach(c => {
      parties[c.PoliticalPartyName] = (parties[c.PoliticalPartyName] || 0) + 1;
    });
    
    Object.entries(parties)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([party, count]) => {
        const isTarget = party === TARGET_PARTY;
        const marker = isTarget ? '🎯' : '  ';
        const truncated = party.substring(0, 50) + (party.length > 50 ? '...' : '');
        console.log(`${marker} ${truncated}: ${count}`);
      });
    
    console.log(`\n✨ Target party records: ${filtered.length}`);
    
    if (filtered.length > 0) {
      console.log(`\n📋 First candidate sample:`);
      console.log(JSON.stringify(filtered[0], null, 2).split('\n').slice(0, 10).join('\n'));
      console.log('...\n');
    }
    
    // Next steps
    console.log('\n✅ Data file is ready for migration!\n');
    console.log('Next steps:');
    console.log('1. Run the migration: node scripts/migrate-candidates.js\n');
    
  } catch (error) {
    console.log(`❌ Error parsing file: ${error.message}`);
  }
  
  rl.close();
}

main().catch(console.error);
