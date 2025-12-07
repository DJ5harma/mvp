import { getDatabase } from "@/lib/db/mongodb";
import bcrypt from "bcryptjs";
import { ExtractedData } from "@/types";
import "dotenv/config";

async function seedAll() {
	try {
		const db = await getDatabase();

		console.log("🌱 Starting database seeding...\n");

		// Clear existing data (optional - comment out if you want to keep existing data)
		console.log("🗑️  Clearing existing data...");
		await db.collection("lenders").deleteMany({});
		await db.collection("users").deleteMany({});
		await db.collection("kyc_documents").deleteMany({});
		await db.collection("loan_reports").deleteMany({});
		await db.collection("applications").deleteMany({});
		console.log("✅ Cleared existing data\n");

		// 1. Seed Lenders
		console.log("📊 Seeding lenders...");
		const lendersCollection = db.collection("lenders");
		const lenders = [
			{
				name: "Tata Capital Bank",
				email: "demo@tata.com",
				password: await bcrypt.hash("demo123", 10),
				companyName: "Tata Capital Bank Limited",
				registrationNumber: "TATA001",
				loanTypes: ["Personal", "Home", "Vehicle", "Business"],
				isActive: true,
				createdAt: new Date(),
			},
			{
				name: "ICICI Bank",
				email: "demo@icici.com",
				password: await bcrypt.hash("demo123", 10),
				companyName: "ICICI Bank Limited",
				registrationNumber: "ICICI001",
				loanTypes: ["Personal", "Home", "Education"],
				isActive: true,
				createdAt: new Date(),
			},
			{
				name: "Axis Bank",
				email: "demo@axis.com",
				password: await bcrypt.hash("demo123", 10),
				companyName: "Axis Bank Limited",
				registrationNumber: "AXIS001",
				loanTypes: ["Personal", "Business", "Vehicle"],
				isActive: true,
				createdAt: new Date(),
			},
		];
		const lenderResults = await lendersCollection.insertMany(lenders);
		const lenderIds = Object.values(lenderResults.insertedIds); // Keep as ObjectIds
		console.log(`✅ Seeded ${lenders.length} lenders\n`);

		// 2. Seed Users
		console.log("👥 Seeding users...");
		const usersCollection = db.collection("users");
		const users = [
			{
				name: "Rajesh Kumar",
				phone: "+919876543210",
				pan: "ABCDE1234F",
				email: "rajesh@example.com",
				creditScore: 780,
				creditGrade: "A+",
				loanPurpose: "Home renovation",
				selectedLoanType: "Personal",
				kycStatus: "completed",
				userScore: 85,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				name: "Priya Sharma",
				phone: "+919876543211",
				pan: "FGHIJ5678K",
				email: "priya@example.com",
				creditScore: 650,
				creditGrade: "B+",
				loanPurpose: "Business expansion",
				selectedLoanType: "Business",
				kycStatus: "completed",
				userScore: 65,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				name: "Amit Patel",
				phone: "+919876543212",
				pan: "LMNOP9012Q",
				email: "amit@example.com",
				creditScore: 520,
				creditGrade: "C",
				loanPurpose: "Vehicle purchase",
				selectedLoanType: "Vehicle",
				kycStatus: "completed",
				userScore: 45,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				name: "Sneha Reddy",
				phone: "+919876543213",
				pan: "RSTUV3456W",
				email: "sneha@example.com",
				creditScore: 720,
				creditGrade: "A",
				loanPurpose: "Education",
				selectedLoanType: "Education",
				kycStatus: "completed",
				userScore: 75,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		];
		const userResults = await usersCollection.insertMany(users);
		const userIds = Object.values(userResults.insertedIds); // Keep as ObjectIds
		console.log(`✅ Seeded ${users.length} users\n`);

		// 3. Seed KYC Documents
		console.log("📄 Seeding KYC documents...");
		const documentsCollection = db.collection("kyc_documents");

		const documentsData = [
			// User 1 - Rajesh (High score)
			{
				userId: userIds[0], // ObjectId
				type: "aadhar",
				fileUrl: "/uploads/aadhar-rajesh.pdf",
				extractedData: {
					name: "Rajesh Kumar",
					dateOfBirth: "1985-05-15",
					address: "123 Main Street, Mumbai, Maharashtra 400001",
					aadharNumber: "1234 5678 9012",
				} as ExtractedData,
				uploadedAt: new Date(),
			},
			{
				userId: userIds[0],
				type: "pan",
				fileUrl: "/uploads/pan-rajesh.pdf",
				extractedData: {
					panNumber: "ABCDE1234F",
				} as ExtractedData,
				uploadedAt: new Date(),
			},
			{
				userId: userIds[0],
				type: "bank_statement",
				fileUrl: "/uploads/bank-rajesh.pdf",
				extractedData: {
					expenseSummary: {
						monthlyExpenses: 45000,
						categories: {
							groceries: 15000,
							utilities: 10000,
							entertainment: 20000,
						},
					},
					savings: 500000,
					emiObligations: {
						totalEMI: 15000,
						loans: [{ lender: "SBI", amount: 15000, remainingTenure: 24 }],
					},
				} as ExtractedData,
				uploadedAt: new Date(),
			},
			{
				userId: userIds[0],
				type: "income_proof",
				fileUrl: "/uploads/income-rajesh.pdf",
				extractedData: {
					incomeSummary: {
						monthlyIncome: 120000,
						annualIncome: 1440000,
					},
				} as ExtractedData,
				uploadedAt: new Date(),
			},

			// User 2 - Priya (Medium score)
			{
				userId: userIds[1],
				type: "aadhar",
				fileUrl: "/uploads/aadhar-priya.pdf",
				extractedData: {
					name: "Priya Sharma",
					dateOfBirth: "1990-08-20",
					address: "456 Business Park, Delhi, Delhi 110001",
					aadharNumber: "2345 6789 0123",
				} as ExtractedData,
				uploadedAt: new Date(),
			},
			{
				userId: userIds[1],
				type: "pan",
				fileUrl: "/uploads/pan-priya.pdf",
				extractedData: {
					panNumber: "FGHIJ5678K",
				} as ExtractedData,
				uploadedAt: new Date(),
			},
			{
				userId: userIds[1],
				type: "bank_statement",
				fileUrl: "/uploads/bank-priya.pdf",
				extractedData: {
					expenseSummary: {
						monthlyExpenses: 35000,
						categories: {
							groceries: 12000,
							utilities: 8000,
							entertainment: 15000,
						},
					},
					savings: 200000,
					emiObligations: {
						totalEMI: 20000,
						loans: [{ lender: "Tata Capital Bank", amount: 20000, remainingTenure: 36 }],
					},
				} as ExtractedData,
				uploadedAt: new Date(),
			},
			{
				userId: userIds[1],
				type: "income_proof",
				fileUrl: "/uploads/income-priya.pdf",
				extractedData: {
					incomeSummary: {
						monthlyIncome: 80000,
						annualIncome: 960000,
					},
				} as ExtractedData,
				uploadedAt: new Date(),
			},

			// User 3 - Amit (Low score)
			{
				userId: userIds[2],
				type: "aadhar",
				fileUrl: "/uploads/aadhar-amit.pdf",
				extractedData: {
					name: "Amit Patel",
					dateOfBirth: "1992-12-10",
					address: "789 Residential Area, Bangalore, Karnataka 560001",
					aadharNumber: "3456 7890 1234",
				} as ExtractedData,
				uploadedAt: new Date(),
			},
			{
				userId: userIds[2],
				type: "pan",
				fileUrl: "/uploads/pan-amit.pdf",
				extractedData: {
					panNumber: "LMNOP9012Q",
				} as ExtractedData,
				uploadedAt: new Date(),
			},
			{
				userId: userIds[2],
				type: "bank_statement",
				fileUrl: "/uploads/bank-amit.pdf",
				extractedData: {
					expenseSummary: {
						monthlyExpenses: 40000,
						categories: {
							groceries: 15000,
							utilities: 10000,
							entertainment: 15000,
						},
					},
					savings: 50000,
					emiObligations: {
						totalEMI: 25000,
						loans: [
							{ lender: "ICICI", amount: 15000, remainingTenure: 48 },
							{ lender: "Axis", amount: 10000, remainingTenure: 36 },
						],
					},
				} as ExtractedData,
				uploadedAt: new Date(),
			},
			{
				userId: userIds[2],
				type: "income_proof",
				fileUrl: "/uploads/income-amit.pdf",
				extractedData: {
					incomeSummary: {
						monthlyIncome: 50000,
						annualIncome: 600000,
					},
				} as ExtractedData,
				uploadedAt: new Date(),
			},

			// User 4 - Sneha (Good score)
			{
				userId: userIds[3],
				type: "aadhar",
				fileUrl: "/uploads/aadhar-sneha.pdf",
				extractedData: {
					name: "Sneha Reddy",
					dateOfBirth: "1988-03-25",
					address: "321 College Road, Hyderabad, Telangana 500001",
					aadharNumber: "4567 8901 2345",
				} as ExtractedData,
				uploadedAt: new Date(),
			},
			{
				userId: userIds[3],
				type: "pan",
				fileUrl: "/uploads/pan-sneha.pdf",
				extractedData: {
					panNumber: "RSTUV3456W",
				} as ExtractedData,
				uploadedAt: new Date(),
			},
			{
				userId: userIds[3],
				type: "bank_statement",
				fileUrl: "/uploads/bank-sneha.pdf",
				extractedData: {
					expenseSummary: {
						monthlyExpenses: 30000,
						categories: {
							groceries: 10000,
							utilities: 8000,
							entertainment: 12000,
						},
					},
					savings: 300000,
					emiObligations: {
						totalEMI: 10000,
						loans: [{ lender: "Tata Capital Bank", amount: 10000, remainingTenure: 12 }],
					},
				} as ExtractedData,
				uploadedAt: new Date(),
			},
			{
				userId: userIds[3],
				type: "income_proof",
				fileUrl: "/uploads/income-sneha.pdf",
				extractedData: {
					incomeSummary: {
						monthlyIncome: 95000,
						annualIncome: 1140000,
					},
				} as ExtractedData,
				uploadedAt: new Date(),
			},
		];

		await documentsCollection.insertMany(documentsData);
		console.log(`✅ Seeded ${documentsData.length} KYC documents\n`);

		// 4. Seed Loan Reports
		console.log("📋 Seeding loan reports...");
		const reportsCollection = db.collection("loan_reports");

		// Create reports with ObjectIds (but LoanReport type expects strings, so we'll cast)
		const reports = [
			{
				userId: userIds[0], // ObjectId
				lenderId: lenderIds[0], // ObjectId
				userIdentity: {
					name: "Rajesh Kumar",
					dateOfBirth: "1985-05-15",
					address: "123 Main Street, Mumbai, Maharashtra 400001",
					aadharNumber: "1234 5678 9012",
					panNumber: "ABCDE1234F",
				},
				kycResults: {
					status: "verified",
					documentsSubmitted: [
						"aadhar",
						"pan",
						"bank_statement",
						"income_proof",
					],
					documentsVerified: [
						"aadhar",
						"pan",
						"bank_statement",
						"income_proof",
					],
				},
				creditScore: 780,
				creditGrade: "A+",
				financialStability: {
					monthlyIncome: 120000,
					monthlyExpenses: 45000,
					savings: 500000,
					emiObligations: 15000,
					disposableIncome: 60000,
				},
				loanEligibility: {
					eligible: true,
					maxLoanAmount: 5000000,
					recommendedTenure: 60,
					riskLevel: "low",
				},
				userScore: 85,
				createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
			},
			{
				userId: userIds[1], // ObjectId
				lenderId: lenderIds[0], // ObjectId
				userIdentity: {
					name: "Priya Sharma",
					dateOfBirth: "1990-08-20",
					address: "456 Business Park, Delhi, Delhi 110001",
					aadharNumber: "2345 6789 0123",
					panNumber: "FGHIJ5678K",
				},
				kycResults: {
					status: "verified",
					documentsSubmitted: [
						"aadhar",
						"pan",
						"bank_statement",
						"income_proof",
					],
					documentsVerified: [
						"aadhar",
						"pan",
						"bank_statement",
						"income_proof",
					],
				},
				creditScore: 650,
				creditGrade: "B+",
				financialStability: {
					monthlyIncome: 80000,
					monthlyExpenses: 35000,
					savings: 200000,
					emiObligations: 20000,
					disposableIncome: 25000,
				},
				loanEligibility: {
					eligible: true,
					maxLoanAmount: 3000000,
					recommendedTenure: 48,
					riskLevel: "medium",
				},
				userScore: 65,
				createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
			},
			{
				userId: userIds[2], // ObjectId
				lenderId: lenderIds[1], // ObjectId
				userIdentity: {
					name: "Amit Patel",
					dateOfBirth: "1992-12-10",
					address: "789 Residential Area, Bangalore, Karnataka 560001",
					aadharNumber: "3456 7890 1234",
					panNumber: "LMNOP9012Q",
				},
				kycResults: {
					status: "verified",
					documentsSubmitted: [
						"aadhar",
						"pan",
						"bank_statement",
						"income_proof",
					],
					documentsVerified: [
						"aadhar",
						"pan",
						"bank_statement",
						"income_proof",
					],
				},
				creditScore: 520,
				creditGrade: "C",
				financialStability: {
					monthlyIncome: 50000,
					monthlyExpenses: 40000,
					savings: 50000,
					emiObligations: 25000,
					disposableIncome: -15000,
				},
				loanEligibility: {
					eligible: false,
					maxLoanAmount: 1000000,
					recommendedTenure: 36,
					riskLevel: "high",
				},
				userScore: 45,
				createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
			},
			{
				userId: userIds[3], // ObjectId
				lenderId: lenderIds[2], // ObjectId
				userIdentity: {
					name: "Sneha Reddy",
					dateOfBirth: "1988-03-25",
					address: "321 College Road, Hyderabad, Telangana 500001",
					aadharNumber: "4567 8901 2345",
					panNumber: "RSTUV3456W",
				},
				kycResults: {
					status: "verified",
					documentsSubmitted: [
						"aadhar",
						"pan",
						"bank_statement",
						"income_proof",
					],
					documentsVerified: [
						"aadhar",
						"pan",
						"bank_statement",
						"income_proof",
					],
				},
				creditScore: 720,
				creditGrade: "A",
				financialStability: {
					monthlyIncome: 95000,
					monthlyExpenses: 30000,
					savings: 300000,
					emiObligations: 10000,
					disposableIncome: 55000,
				},
				loanEligibility: {
					eligible: true,
					maxLoanAmount: 4000000,
					recommendedTenure: 48,
					riskLevel: "low",
				},
				userScore: 75,
				createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
			},
		];

		const reportResults = await reportsCollection.insertMany(reports);
		const reportIds = Object.values(reportResults.insertedIds);
		console.log(`✅ Seeded ${reports.length} loan reports\n`);

		// 5. Seed Applications
		console.log("📝 Seeding applications...");
		const applicationsCollection = db.collection("applications");

		const applications = [
			{
				reportId: reportIds[0], // ObjectId
				userId: userIds[0], // ObjectId
				lenderId: lenderIds[0], // ObjectId
				status: "approved",
				userScore: 85,
				creditScore: 780,
				creditGrade: "A+",
				loanType: "Personal",
				lenderMessage:
					"Congratulations! Your loan application has been approved. We will process the disbursement within 2-3 business days.",
				createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
				updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
			},
			{
				reportId: reportIds[1], // ObjectId
				userId: userIds[1], // ObjectId
				lenderId: lenderIds[0], // ObjectId
				status: "pending",
				userScore: 65,
				creditScore: 650,
				creditGrade: "B+",
				loanType: "Business",
				createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
				updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
			},
			{
				reportId: reportIds[2], // ObjectId
				userId: userIds[2], // ObjectId
				lenderId: lenderIds[1], // ObjectId
				status: "rejected",
				userScore: 45,
				creditScore: 520,
				creditGrade: "C",
				loanType: "Vehicle",
				lenderMessage:
					"We regret to inform you that your loan application has been rejected due to high debt-to-income ratio and low credit score. Please improve your credit profile and try again after 6 months.",
				createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
				updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
			},
			{
				reportId: reportIds[3], // ObjectId
				userId: userIds[3], // ObjectId
				lenderId: lenderIds[2], // ObjectId
				status: "pending",
				userScore: 75,
				creditScore: 720,
				creditGrade: "A",
				loanType: "Education",
				createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
				updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
			},
		];

		await applicationsCollection.insertMany(applications);
		console.log(`✅ Seeded ${applications.length} applications\n`);

		console.log("🎉 Database seeding completed successfully!\n");
		console.log("📊 Summary:");
		console.log(`   - ${lenders.length} Lenders`);
		console.log(`   - ${users.length} Users`);
		console.log(`   - ${documentsData.length} KYC Documents`);
		console.log(`   - ${reports.length} Loan Reports`);
		console.log(`   - ${applications.length} Applications\n`);
		console.log("🔑 Lender Login Credentials:");
		console.log("   Tata Capital Bank: demo@tata.com / demo123");
		console.log("   ICICI Bank: demo@icici.com / demo123");
		console.log("   Axis Bank: demo@axis.com / demo123\n");
		console.log("👤 Test User Data:");
		console.log("   User 1 (Rajesh): Approved application with Tata Capital Bank");
		console.log("   User 2 (Priya): Pending application with Tata Capital Bank");
		console.log("   User 3 (Amit): Rejected application with ICICI");
		console.log("   User 4 (Sneha): Pending application with Axis\n");
	} catch (error) {
		console.error("❌ Error seeding database:", error);
		throw error;
	}
}

// Run if called directly
if (require.main === module) {
	seedAll()
		.then(() => {
			console.log("✅ Seeding completed!");
			process.exit(0);
		})
		.catch((error) => {
			console.error("❌ Seeding failed:", error);
			process.exit(1);
		});
}

export default seedAll;
