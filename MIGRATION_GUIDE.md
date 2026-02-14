#!/bin/bash

# Candidate Migration Helper Script
# This script will help you import candidates for the target political party

echo "🔍 Candidate Migration Assistant"
echo "=================================="
echo ""
echo "This migration requires the election candidate data in JSON format."
echo ""
echo "Required data file:"
echo "  Location: /Users/baivab/Projects/nekapa/election-app/client/src/constants/data.constant.txt"
echo "  Format: JSON array of candidate objects"
echo "  Filter: PoliticalPartyName = 'नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)'"
echo ""
echo "Steps to complete the migration:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  Populate the data.constant.txt file:"
echo "   - Copy your complete candidate data JSON array to:"
echo "     /Users/baivab/Projects/nekapa/election-app/client/src/constants/data.constant.txt"
echo ""
echo "2️⃣  Verify the data file:"
echo "   cd /Users/baivab/Projects/nekapa/election-app/server"
echo "   node scripts/test-data.js"
echo ""
echo "3️⃣  Run the migration:"
echo "   cd /Users/baivab/Projects/nekapa/election-app/server"
echo "   node scripts/migrate-candidates.js"
echo ""
echo "Expected data structure:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
cat << 'EOF'
[
  {
    "CandidateID": 339933,
    "CandidateName": "क्षितिज थेबे",
    "AGE_YR": 38,
    "Gender": "पुरुष",
    "PoliticalPartyName": "नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)",
    "SYMBOLCODE": 2598,
    "SymbolName": "सुर्य",
    "DistrictName": "ताप्लेजुङ",
    "StateName": "कोशी प्रदेश",
    "SCConstID": 1,
    "QUALIFICATION": "स्नातक",
    "NAMEOFINST": "TU",
    "EXPERIENCE": "0",
    "ADDRESS": "ताप्लेजुङ सिरीजङ्घा गाउँपालिका मादिबुङ",
    "FATHER_NAME": "भुपेन्द्र  थेबे",
    "DOB": 38,
    "CTZDIST": "ताप्लेजुङ"
  },
  ...
]
EOF
echo ""
echo "Column mappings to database:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
cat << 'EOF'
Data Field              → Database Field                  → Example
────────────────────────────────────────────────────────────────
CandidateID             → Used for photo: {id}.jpg        → 339933
CandidateName           → personalInfo.fullName           → क्षितिज थेबे
AGE_YR                  → personalInfo age reference      → 38
Gender                  → personalInfo.gender             → पुरुष/महिला → Male/Female
PoliticalPartyName      → politicalInfo.partyName         → नेपाल कम्युनिष्ट...
SymbolName              → politicalInfo.electionSymbol    → सुर्य
DistrictName            → politicalInfo.constituency      → ताप्लेजुङ
QUALIFICATION           → education.highestQualification  → स्नातक
NAMEOFINST              → education.institution           → TU
EXPERIENCE              → professionalExperience.prev...  → details
ADDRESS                 → personalInfo.permanentAddress   → full address
CTZDIST                 → personalInfo.citizenshipIssuedDistrict
FATHER_NAME             → Custom field (optional)         → भुपेन्द्र  थेबे

Photo URL Format:       → https://result.election.gov.np/Images/Candidate/{CandidateID}.jpg
EOF
echo ""
echo "✅ Migration will:"
echo "  • Delete all existing candidates from the target political party"
echo "  • Insert new candidates with correct data structure"
echo "  • Map all available fields from the source data"
echo "  • Set profile photos with the official election URL format"
echo ""
