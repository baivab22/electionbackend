const fs = require('fs');
const path = require('path');

try {
  const dataFilePath = path.join(__dirname, '../../client/src/constants/data.constant.txt');
  console.log('📁 Reading file from:', dataFilePath);
  
  const rawData = fs.readFileSync(dataFilePath, 'utf-8');
  console.log('📄 File size:', rawData.length, 'bytes');
  
  // Show first 500 characters
  console.log('📝 First 500 characters:');
  console.log(rawData.substring(0, 500));
  
  // Try to parse
  const parsed = JSON.parse(rawData);
  console.log('✅ JSON parsed successfully');
  console.log('📊 Total records:', parsed.length);
  
  // Check for target party
  const TARGET_PARTY = 'नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)';
  const filtered = parsed.filter(c => c.PoliticalPartyName === TARGET_PARTY);
  console.log('🎯 Filtered count:', filtered.length);
  
  // Show first candidate
  if (parsed.length > 0) {
    console.log('\n📋 First candidate sample:');
    console.log(JSON.stringify(parsed[0], null, 2));
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
