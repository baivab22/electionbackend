# Candidate Migration Tool - Complete Guide

## 🎯 Overview

This tool helps you import candidate data from your election data source (data.constant.txt) into the MongoDB database with the correct structure.

**Target Political Party:** नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)

## 📋 Step-by-Step Instructions

### Step 1: Set Up the Data File

The migration requires candidate data in JSON format at:
```
/Users/baivab/Projects/nekapa/election-app/client/src/constants/data.constant.txt
```

#### Option A: Interactive Setup (Recommended)
```bash
cd /Users/baivab/Projects/nekapa/election-app/server
node scripts/setup-data.js
```

This script will:
- Check if the data file exists
- Help you paste JSON data
- Create sample data for testing
- Verify the data structure
- Show statistics about your data

#### Option B: Manual Setup
1. Place your JSON data in `data.constant.txt`
2. The file must contain a JSON array of candidate objects
3. Each object should have: `CandidateID`, `CandidateName`, `AGE_YR`, `Gender`, `PoliticalPartyName`, etc.

### Step 2: Verify the Data (Optional)

```bash
cd /Users/baivab/Projects/nekapa/election-app/server
node scripts/test-data.js
```

This will:
- Parse your JSON data
- Count total candidates
- Show matching candidates for the target party
- Display a sample record

### Step 3: Run the Migration

```bash
cd /Users/baivab/Projects/nekapa/election-app/server
node scripts/migrate-candidates.js
```

This will:
- Connect to MongoDB
- Filter candidates by the target political party
- Create backups of existing data
- Delete old candidates from that party
- Insert new candidates with proper mapping
- Verify the insertion
- Show a detailed summary

## 📊 Expected Data Format

Your JSON array should look like this:

```json
[
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
    "QUALIFICATION": "स्नातक",
    "NAMEOFINST": "TU",
    "EXPERIENCE": "0",
    "OTHERDETAILS": "0",
    "ADDRESS": "ताप्लेजुङ सिरीजङ्घा गाउँपालिका मादिबुङ",
    "FATHER_NAME": "भुपेन्द्र  थेबे",
    "DOB": 38
  },
  ...
]
```

## 🔄 Field Mapping

The migration script maps your data fields to the database schema as follows:

| Source Field | Database Field | Example |
|---|---|---|
| `CandidateID` | Used for photo URL | `339933` |
| `CandidateName` | `personalInfo.fullName/_np` | क्षितिज थेबे |
| `AGE_YR` | Age reference | 38 |
| `Gender` | `personalInfo.gender` | पुरुष → Male<br/>महिला → Female |
| `PoliticalPartyName` | `politicalInfo.partyName/_np` | नेपाल कम्युनिष्ट पार्टी... |
| `SymbolName` | `politicalInfo.electionSymbol` | सुर्य |
| `DistrictName` | `politicalInfo.constituency` | ताप्लेजुङ |
| `QUALIFICATION` | `education.highestQualification` | स्नातक |
| `NAMEOFINST` | `education.institution` | TU |
| `EXPERIENCE` | `professionalExperience.previousExperience` | work details |
| `OTHERDETAILS` | `politicalExperience.majorAchievements` | achievements |
| `ADDRESS` | `personalInfo.permanentAddress` | full address |
| `CTZDIST` | `personalInfo.citizenshipIssuedDistrict` | ताप्लेजुङ |
| `FATHER_NAME` | Available in data | भुपेन्द्र  थेबे |

## 📸 Photo URLs

All candidates will have photos in the format:
```
https://result.election.gov.np/Images/Candidate/{CandidateID}.jpg
```

Example: `https://result.election.gov.np/Images/Candidate/339933.jpg`

## 💾 Backup and Recovery

The migration automatically creates a backup before deleting old data:
```
./scripts/migrate-backup-{timestamp}.json
```

If you need to restore:
1. The backup file contains all deleted records
2. You can manually restore from MongoDB if needed
3. All operations are logged

## 🔍 What the Migration Does

1. **Validates Data**
   - Checks if JSON is properly formatted
   - Ensures all required fields exist
   - Shows any data structure issues

2. **Connects to Database**
   - Establishes connection to MongoDB
   - Verifies credentials

3. **Creates Backup**
   - Exports existing candidates (if any)
   - Saves to timestamped backup file

4. **Deletes Old Data**
   - Removes candidates from the target political party
   - Prevents duplicates

5. **Inserts New Data**
   - Transforms data to proper schema
   - Inserts all candidates
   - Verifies successful insertion

6. **Generates Report**
   - Shows statistics
   - Lists sample records
   - Confirms completion

## ⚠️ Important Notes

### Data Integrity
- The migration properly handles Nepali text encoding
- All address and name fields preserve Unicode characters
- Gender translations: पुरुष = Male, महिला = Female

### Photo URLs
- All photos use official election commission URLs
- Photos must exist at the source URL
- Format: `https://result.election.gov.np/Images/Candidate/{ID}.jpg`

### Duplicates
- Migration clears existing candidates before inserting
- No duplicate records will be created
- Backups preserve removed data

## 🚀 Quick Commands Reference

```bash
# Setup data file
node scripts/setup-data.js

# Test data
node scripts/test-data.js

# Run migration
node scripts/migrate-candidates.js

# Check database
# (Use MongoDB client or compass)
```

## 🆘 Troubleshooting

### "Data file is empty"
→ Run `node scripts/setup-data.js` to populate it

### "No candidates found for target party"
→ Check if political party name matches exactly (case-sensitive)

### "Invalid JSON"
→ Validate your JSON at https://jsonlint.com/

### "Database connection failed"
→ Verify MONGODB_URI in .env file

### "Insert failed"
→ Check MongoDB connection and user permissions

## 📞 Support

For issues:
1. Check the console output for specific errors
2. Verify the data format
3. Ensure MongoDB is accessible
4. Check environment variables in .env

## ✅ Success Indicators

Migration succeeded when you see:
```
✅ Migration completed successfully!
📊 MIGRATION SUMMARY
Deleted: X
Inserted: Y
Verified: Y
Sample of inserted candidates: [list shown]
```

---

**Created:** February 12, 2026
**Last Updated:** February 12, 2026
