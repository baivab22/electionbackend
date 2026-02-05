const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  // १. आधारभूत व्यक्तिगत विवरण (Basic Personal Information)
  personalInfo: {
    fullName: { type: String, required: true, trim: true },
    fullName_np: { type: String, trim: true },
    nickname: { type: String, trim: true }, // उपनाम / लोकप्रिय नाम
    nickname_np: { type: String, trim: true },
    dateOfBirth: { type: Date, required: true },
    age: { type: Number },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    gender_np: { type: String },
    maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'] },
    maritalStatus_np: { type: String },
    permanentAddress: { type: String, trim: true },
    permanentAddress_np: { type: String, trim: true },
    currentAddress: { type: String, trim: true },
    currentAddress_np: { type: String, trim: true },
    citizenshipNumber: { type: String, trim: true },
    citizenshipIssuedDistrict: { type: String, trim: true },
    citizenshipIssuedDistrict_np: { type: String, trim: true },
    contactNumber: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    website: { type: String, trim: true },
    profilePhoto: { type: String }
  },

  // २. राजनीतिक परिचय (Political Introduction)
  politicalInfo: {
    partyName: { type: String, trim: true },
    partyName_np: { type: String, trim: true },
    currentPosition: { type: String, trim: true }, // वर्तमान पद / जिम्मेवारी
    currentPosition_np: { type: String, trim: true },
    candidacyLevel: { type: String, enum: ['Federal', 'Provincial', 'Local'] }, // संघ / प्रदेश / स्थानीय
    candidacyLevel_np: { type: String },
    constituencyNumber: { type: String, trim: true }, // निर्वाचन क्षेत्र नम्बर
    constituency: { type: String, trim: true },
    constituency_np: { type: String, trim: true },
    electionSymbol: { type: String, trim: true }, // निर्वाचन चिन्ह
    electionSymbol_np: { type: String, trim: true },
    electionSymbolImage: { type: String },
    isFirstTimeCandidate: { type: Boolean, default: false }, // पहिलो पटक उम्मेदवार
    previousElectionHistory: { type: String }, // विगतको निर्वाचन इतिहास
    previousElectionHistory_np: { type: String }
  },

  // ३. शैक्षिक योग्यता (Educational Qualification)
  education: {
    highestQualification: { type: String, trim: true }, // उच्चतम शैक्षिक योग्यता
    highestQualification_np: { type: String, trim: true },
    subject: { type: String, trim: true }, // विषय / संकाय
    subject_np: { type: String, trim: true },
    institution: { type: String, trim: true }, // अध्ययन गरेको संस्था
    institution_np: { type: String, trim: true },
    country: { type: String, trim: true },
    country_np: { type: String, trim: true },
    additionalTraining: { type: String }, // अतिरिक्त तालिम / प्रमाणपत्र / अनुसन्धान
    additionalTraining_np: { type: String },
    educationDetails: [{
      degree: String,
      degree_np: String,
      institution: String,
      institution_np: String,
      year: String,
      subject: String,
      subject_np: String
    }]
  },

  // ४. पेशागत अनुभव (Professional Experience)
  professionalExperience: {
    currentProfession: { type: String, trim: true }, // हालको पेशा
    currentProfession_np: { type: String, trim: true },
    previousExperience: { type: String }, // विगतको पेशागत अनुभव
    previousExperience_np: { type: String },
    organizationResponsibility: { type: String }, // सरकारी / निजी / सामाजिक संस्थामा जिम्मेवारी
    organizationResponsibility_np: { type: String },
    leadershipExperience: { type: String }, // नेतृत्व वा व्यवस्थापन अनुभव
    leadershipExperience_np: { type: String },
    workHistory: [{
      position: String,
      position_np: String,
      organization: String,
      organization_np: String,
      duration: String,
      description: String,
      description_np: String
    }]
  },

  // ५. राजनीतिक अनुभव र योगदान (Political Experience & Contribution)
  politicalExperience: {
    partyJoinYear: { type: String }, // पार्टीमा आबद्ध भएको वर्ष
    movementRole: { type: String }, // आन्दोलन / अभियानमा भूमिका
    movementRole_np: { type: String },
    previousRepresentativePosition: { type: String }, // जनप्रतिनिधि भइसकेको भए पद र कार्यकाल
    previousRepresentativePosition_np: { type: String },
    majorAchievements: { type: String }, // मुख्य उपलब्धिहरू
    majorAchievements_np: { type: String },
    politicalHistory: [{
      position: String,
      position_np: String,
      tenure: String,
      achievements: String,
      achievements_np: String
    }]
  },

  // ६. सामाजिक तथा सामुदायिक संलग्नता (Social & Community Engagement)
  socialEngagement: {
    ngoInvolvement: { type: String }, // सामाजिक सेवा / NGO संलग्नता
    ngoInvolvement_np: { type: String },
    sectorWork: { type: String }, // शिक्षा, स्वास्थ्य, युवा, महिला, कृषि आदि क्षेत्रमा काम
    sectorWork_np: { type: String },
    awardsHonors: { type: String }, // प्राप्त सम्मान वा पुरस्कार
    awardsHonors_np: { type: String },
    communityProjects: [{
      projectName: String,
      projectName_np: String,
      description: String,
      description_np: String,
      year: String
    }]
  },

  // ७. आर्थिक विवरण (Financial Information)
  financialInfo: {
    movableAssets: { type: String }, // चल सम्पत्ति विवरण
    movableAssets_np: { type: String },
    immovableAssets: { type: String }, // अचल सम्पत्ति विवरण
    immovableAssets_np: { type: String },
    annualIncomeSource: { type: String }, // वार्षिक आय स्रोत
    annualIncomeSource_np: { type: String },
    bankLoans: { type: String }, // बैंक ऋण वा अन्य दायित्व
    bankLoans_np: { type: String },
    taxStatus: { type: String }, // कर तिरेको स्थिति
    taxStatus_np: { type: String }
  },

  // ८. कानुनी अवस्था (Legal Status)
  legalStatus: {
    hasCriminalCase: { type: Boolean, default: false }, // कुनै आपराधिक मुद्दा छ?
    caseDetails: { type: String }, // अदालतको फैसला वा विचाराधीन मुद्दा विवरण
    caseDetails_np: { type: String },
    eligibilityDeclaration: { type: String }, // निर्वाचन लड्न योग्यताको घोषणा
    eligibilityDeclaration_np: { type: String }
  },

  // ९. दृष्टि, लक्ष्य र घोषण (Vision, Goals & Declaration)
  visionGoals: {
    vision: { type: String }, // दृष्टि
    vision_np: { type: String },
    goals: { type: String }, // लक्ष्य
    goals_np: { type: String },
    declaration: { type: String }, // घोषण
    declaration_np: { type: String },
    manifesto: { type: String },
    manifesto_np: { type: String },
    keyPromises: [{
      promise: String,
      promise_np: String,
      category: String
    }]
  },

  // Social Media Links
  socialMedia: {
    facebook: String,
    twitter: String,
    instagram: String,
    youtube: String,
    tiktok: String,
    linkedin: String
  },

  // Campaign Info
  campaign: {
    campaignStartDate: Date,
    campaignEndDate: Date,
    campaignSlogan: String,
    campaignSlogan_np: String,
    votingTarget: { type: Number, default: 0 },
    campaignManager: {
      name: String,
      phone: String,
      email: String
    }
  },

  // Documents
  documents: {
    citizenshipPhoto: String,
    profilePhoto: String,
    partyIdPhoto: String,
    electionSymbolPhoto: String,
    otherDocuments: [String]
  },

  // Social Engagement
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  comments: [{
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    comment: { type: String, required: true, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now },
    isApproved: { type: Boolean, default: false }
  }],
  shares: { type: Number, default: 0 },

  // Status & Metadata
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
candidateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  // Calculate age from dateOfBirth
  if (this.personalInfo && this.personalInfo.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.personalInfo.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    this.personalInfo.age = age;
  }
  next();
});

module.exports = mongoose.model('Candidate', candidateSchema);
