import { User, ExtractedData, UserScore } from '@/types';

export function calculateUserScore(
  user: User,
  extractedData: ExtractedData[],
  creditScore: number,
  documentTypes?: string[]
): UserScore {
  const userId = user._id || '';
  // Income Stability (0-25 points)
  const incomeStability = calculateIncomeStability(extractedData);
  
  // EMI Burden (0-25 points) - lower burden = higher score
  const emiBurden = calculateEMIBurden(extractedData);
  
  // Savings Ratio (0-20 points)
  const savingsRatio = calculateSavingsRatio(extractedData);
  
  // Credit Score (0-20 points) - normalized from 300-900 to 0-20
  const creditScorePoints = Math.max(0, Math.min(20, ((creditScore - 300) / 600) * 20));
  
  // Document Accuracy (0-10 points) - based on completeness
  const documentAccuracy = calculateDocumentAccuracy(documentTypes || []);
  
  const totalScore = incomeStability + emiBurden + savingsRatio + creditScorePoints + documentAccuracy;
  
  return {
    userId,
    incomeStability,
    emiBurden,
    savingsRatio,
    creditScore: creditScorePoints,
    documentAccuracy,
    totalScore: Math.round(totalScore),
    calculatedAt: new Date(),
  };
}

function calculateIncomeStability(extractedData: ExtractedData[]): number {
  const incomeData = extractedData.find(d => d.incomeSummary);
  if (!incomeData?.incomeSummary) return 0;
  
  const monthlyIncome = incomeData.incomeSummary.monthlyIncome;
  
  // Score based on income level (assuming stable if > 50k)
  if (monthlyIncome >= 100000) return 25;
  if (monthlyIncome >= 50000) return 20;
  if (monthlyIncome >= 30000) return 15;
  if (monthlyIncome >= 20000) return 10;
  return 5;
}

function calculateEMIBurden(extractedData: ExtractedData[]): number {
  const bankData = extractedData.find(d => d.emiObligations && d.incomeSummary);
  if (!bankData?.incomeSummary) return 15; // Default if no data
  
  const monthlyIncome = bankData.incomeSummary.monthlyIncome;
  const totalEMI = bankData.emiObligations?.totalEMI || 0;
  
  const emiRatio = totalEMI / monthlyIncome;
  
  // Lower EMI burden = higher score
  if (emiRatio < 0.2) return 25; // < 20% of income
  if (emiRatio < 0.3) return 20; // < 30%
  if (emiRatio < 0.4) return 15; // < 40%
  if (emiRatio < 0.5) return 10; // < 50%
  return 5; // > 50%
}

function calculateSavingsRatio(extractedData: ExtractedData[]): number {
  const bankData = extractedData.find(d => d.savings && d.incomeSummary);
  if (!bankData?.incomeSummary || !bankData.savings) return 5;
  
  const monthlyIncome = bankData.incomeSummary.monthlyIncome;
  const savings = bankData.savings;
  const monthlySavings = savings / 12; // Assuming annual savings
  
  const savingsRatio = monthlySavings / monthlyIncome;
  
  if (savingsRatio >= 0.3) return 20; // > 30%
  if (savingsRatio >= 0.2) return 15; // > 20%
  if (savingsRatio >= 0.1) return 10; // > 10%
  return 5; // < 10%
}

function calculateDocumentAccuracy(documentTypes: string[]): number {
  // Required documents: aadhar, pan, bank_statement, income_proof
  const requiredDocs = ['aadhar', 'pan', 'bank_statement', 'income_proof'];
  
  if (!documentTypes || documentTypes.length === 0) {
    return 0;
  }
  
  const completeness = requiredDocs.filter(doc => 
    documentTypes.includes(doc)
  ).length / requiredDocs.length;
  
  return Math.round(completeness * 10);
}

export function getCreditGrade(creditScore: number): 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' {
  if (creditScore >= 750) return 'A+';
  if (creditScore >= 700) return 'A';
  if (creditScore >= 650) return 'B+';
  if (creditScore >= 600) return 'B';
  if (creditScore >= 550) return 'C+';
  if (creditScore >= 500) return 'C';
  return 'D';
}

export function mockCreditScore(phone?: string, pan?: string): number {
  // Generate a mock credit score based on input
  // In production, this would call an actual credit bureau API
  if (phone) {
    // Use phone number hash to generate consistent score
    const hash = phone.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 500 + (hash % 400); // Score between 500-900
  }
  if (pan) {
    const hash = pan.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 500 + (hash % 400);
  }
  return 600; // Default score
}

/**
 * Calculate EMI (Equated Monthly Installment) using the formula:
 * EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]
 * Where:
 * P = Principal loan amount
 * R = Monthly interest rate (annual rate / 12 / 100)
 * N = Loan tenure in months
 */
export function calculateEMI(principal: number, annualInterestRate: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualInterestRate <= 0) return principal / tenureMonths; // No interest, simple division
  
  const monthlyRate = annualInterestRate / 12 / 100;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
              (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  
  return Math.round(emi);
}

