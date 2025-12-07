export interface User {
  _id?: string;
  name: string;
  phone?: string;
  pan?: string;
  email?: string;
  creditScore?: number;
  creditGrade?: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
  loanPurpose?: string;
  selectedLoanType?: LoanType;
  selectedLender?: string;
  selectedOffer?: LoanOffer;
  kycStatus?: 'pending' | 'in_progress' | 'completed';
  userScore?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Lender {
  _id?: string;
  name: string;
  email: string;
  password: string;
  companyName: string;
  registrationNumber: string;
  loanTypes: LoanType[];
  isActive: boolean;
  createdAt?: Date;
}

export type LoanType = 'Personal' | 'Business' | 'Home' | 'Vehicle' | 'Education' | 'Gold';

export interface LoanOffer {
  lenderId: string;
  lenderName: string;
  loanType: LoanType;
  interestRate: number;
  tenureOptions: number[]; // in months
  maxAmount: number;
  platformDiscount: number; // percentage
  specialOffers: string[];
  eligibilityScore: number; // minimum score required
}

export interface KYCDocument {
  _id?: string;
  userId: string;
  type: 'aadhar' | 'pan' | 'bank_statement' | 'income_proof' | 'cancelled_cheque' | 'passbook' | 'signature' | 'biometric';
  fileUrl: string;
  extractedData?: ExtractedData;
  uploadedAt?: Date;
}

export interface ExtractedData {
  name?: string;
  dateOfBirth?: string;
  address?: string;
  aadharNumber?: string;
  panNumber?: string;
  incomeSummary?: {
    monthlyIncome: number;
    annualIncome: number;
  };
  expenseSummary?: {
    monthlyExpenses: number;
    categories: Record<string, number>;
  };
  emiObligations?: {
    totalEMI: number;
    loans: Array<{
      lender: string;
      amount: number;
      remainingTenure: number;
    }>;
  };
  savings?: number;
  loanRepaymentCapability?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ChatSession {
  sessionId: string;
  userId?: string;
  messages: ChatMessage[];
  currentStep: ChatStep;
  context: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type ChatStep =
  | 'greeting'
  | 'ask_name'
  | 'ask_loan_purpose'
  | 'show_loan_types'
  | 'loan_type_selected'
  | 'ask_loan_amount'
  | 'eligibility_check'
  | 'show_lenders'
  | 'loan_selected'
  | 'kyc_collection'
  | 'document_upload'
  | 'processing'
  | 'report_generated'
  | 'lender_chat';

export interface UserScore {
  userId: string;
  incomeStability: number; // 0-25
  emiBurden: number; // 0-25
  savingsRatio: number; // 0-20
  creditScore: number; // 0-20
  documentAccuracy: number; // 0-10
  totalScore: number; // 0-100
  calculatedAt: Date;
}

export interface LoanReport {
  _id?: string;
  userId: string;
  lenderId: string;
  userIdentity: {
    name: string;
    dateOfBirth: string;
    address: string;
    aadharNumber: string;
    panNumber: string;
  };
  kycResults: {
    status: 'verified' | 'pending' | 'rejected';
    documentsSubmitted: string[];
    documentsVerified: string[];
  };
  creditScore: number;
  creditGrade: string;
  financialStability: {
    monthlyIncome: number;
    monthlyExpenses: number;
    savings: number;
    emiObligations: number;
    disposableIncome: number;
  };
  loanEligibility: {
    eligible: boolean;
    maxLoanAmount: number;
    recommendedTenure: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  userScore: number;
  createdAt: Date;
}

export interface LenderMessage {
  _id?: string;
  lenderId: string;
  userId: string;
  message: string;
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
  }>;
  isSanctionLetter?: boolean;
  createdAt: Date;
}

