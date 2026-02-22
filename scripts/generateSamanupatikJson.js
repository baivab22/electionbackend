const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, '../data/samanupatiklist.xlsx');
const outputPath = path.join(__dirname, '../data/samanupatiklist.json');

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(sheet);

const createdAt = new Date('2026-02-20T15:43:41.927+00:00');
const updatedAt = createdAt;

const mapped = rows.map(row => ({
  ageDetails: row.gender || '',
  profilepicture: '',
  area: '',
  name: row['candidate name'] || '',
  detaildescription: '',
  politicalBehaviour: '',
  politicalHIstory: '',
  politicaltimeline: '',
  __v: 0,
  createdAt,
  updatedAt,
  candidancyType: 'samanupatik',
  clustername: row.clustername || ''
}));

fs.writeFileSync(outputPath, JSON.stringify(mapped, null, 2));
console.log(`Generated ${mapped.length} records in samanupatiklist.json`);