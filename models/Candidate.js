
const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
	province: { type: String, default: '' },
	district: { type: String, default: '' },
	palika: { type: String, default: '' },
	wardNo: { type: Number }
}, { _id: false });

const candidateSchema = new mongoose.Schema(
	{
		personalInfo: {
			fullName: { type: String, required: true, trim: true },
			fullName_np: { type: String, default: '' },
			nickname: { type: String, default: '' },
			nickname_np: { type: String, default: '' },
			dateOfBirth: { type: Date },
			dateOfBirth_raw: { type: String, default: null },
			gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Other' },
			maritalStatus: { type: String, default: '' },
			permanentAddress: { type: String, default: '' },
			currentAddress: { type: String, default: '' },
			citizenshipNumber: { type: String, default: '' },
			citizenshipIssuedDistrict: { type: String, default: '' },
			contactNumber: { type: String, default: '' },
			email: { type: String, lowercase: true, trim: true, default: null },
			website: { type: String, default: '' },
			profilePhoto: { type: String, default: '' }
		},

		politicalInfo: {
			partyName: { type: String, default: '' },
			partyName_np: { type: String, default: '' },
			currentPosition: { type: String, default: '' },
			currentPosition_np: { type: String, default: '' },
			candidacyLevel: { type: String, default: '' },
			candidacyLevel_np: { type: String, default: '' },
			constituencyNumber: { type: String, default: '' },
			constituency: { type: String, default: '' },
			constituency_np: { type: String, default: '' },
			electionSymbol: { type: String, default: '' },
			electionSymbol_np: { type: String, default: '' },
			electionSymbolImage: { type: String, default: '' },
			isFirstTimeCandidate: { type: Boolean, default: false },
			previousElectionHistory: { type: String, default: '' }
		},

		education: {
			highestQualification: { type: String, default: '' },
			highestQualification_np: { type: String, default: '' },
			subject: { type: String, default: '' },
			subject_np: { type: String, default: '' },
			institution: { type: String, default: '' },
			institution_np: { type: String, default: '' },
			country: { type: String, default: '' },
			country_np: { type: String, default: '' },
			additionalTraining: { type: String, default: '' }
		},

		professionalExperience: {
			currentProfession: { type: String, default: '' },
			currentProfession_np: { type: String, default: '' },
			previousExperience: { type: String, default: '' },
			previousExperience_np: { type: String, default: '' },
			organizationResponsibility: { type: String, default: '' },
			organizationResponsibility_np: { type: String, default: '' },
			leadershipExperience: { type: String, default: '' }
		},

		politicalExperience: {
			partyJoinYear: { type: String, default: '' },
			movementRole: { type: String, default: '' },
			movementRole_np: { type: String, default: '' },
			previousRepresentativePosition: { type: String, default: '' },
			previousRepresentativePosition_np: { type: String, default: '' },
			majorAchievements: { type: String, default: '' }
		},

		socialEngagement: {
			ngoInvolvement: { type: String, default: '' },
			ngoInvolvement_np: { type: String, default: '' },
			sectorWork: { type: String, default: '' },
			sectorWork_np: { type: String, default: '' },
			awardsHonors: { type: String, default: '' }
		},

		financialInfo: {
			movableAssets: { type: String, default: '' },
			immovableAssets: { type: String, default: '' },
			annualIncomeSource: { type: String, default: '' },
			bankLoans: { type: String, default: '' },
			taxStatus: { type: String, default: '' }
		},

		legalStatus: {
			hasCriminalCase: { type: Boolean, default: false },
			caseDetails: { type: String, default: '' },
			eligibilityDeclaration: { type: String, default: '' }
		},

		visionGoals: {
			vision: { type: String, default: '' },
			vision_np: { type: String, default: '' },
			goals: { type: String, default: '' },
			goals_np: { type: String, default: '' },
			declaration: { type: String, default: '' }
		},

		socialMedia: {
			facebook: { type: String, default: '' },
			twitter: { type: String, default: '' },
			instagram: { type: String, default: '' },
			youtube: { type: String, default: '' },
			website: { type: String, default: '' }
		},

		campaign: {
			campaignSlogan: { type: String, default: '' },
			votingTarget: { type: Number }
		},

		manifesto: {
			title_en: { type: String, default: '' },
			content_en: { type: String, default: '' },
			manifestoBrochure: { type: String, default: '' }
		},

		issues: [{
			issueTitle_en: String,
			issueDescription_en: String,
			issueCategory: String,
			priority: Number
		}],

		achievements: [{
			achievementTitle_en: String,
			achievementDescription_en: String,
			achievementDate: String,
			achievementCategory: String,
			achievementImage: String
		}],

		documents: { type: Object, default: {} },

		likes: { type: Number, default: 0 },
		shares: { type: Number, default: 0 },
		isActive: { type: Boolean, default: false },
		isVerified: { type: Boolean, default: false },
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
		electionYear: { type: String, default: new Date().getFullYear().toString() },
		electionType: { type: String, default: 'General' },
		candidateId: { type: String, index: true, unique: false, sparse: true },

		// Keep raw source for imports
		rawSource: { type: Object, default: {} }
	},
	{ timestamps: true }
);

candidateSchema.pre('save', function (next) {
	if (!this.candidateId && this.personalInfo && this.personalInfo.fullName) {
		const slug = this.personalInfo.fullName
			.toString()
			.normalize('NFKD')
			.replace(/[^a-zA-Z0-9\s.-]/g, '')
			.trim()
			.replace(/\s+/g, '-')
			.toLowerCase();
		this.candidateId = `${slug}-${Date.now()}`;
	}
	next();
});

module.exports = mongoose.model('Candidate', candidateSchema);

