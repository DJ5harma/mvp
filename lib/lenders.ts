import { getDatabase } from '@/lib/db/mongodb';
import { LoanOffer, LoanType } from '@/types';

// Mock lenders as fallback
const MOCK_LENDERS: LoanOffer[] = [
  {
    lenderId: 'lender1',
    lenderName: 'HDFC Bank',
    loanType: 'Personal',
    interestRate: 10.5,
    tenureOptions: [12, 24, 36, 48, 60],
    maxAmount: 5000000,
    platformDiscount: 0.5,
    specialOffers: ['Zero processing fee', 'Instant approval'],
    eligibilityScore: 60,
  },
  {
    lenderId: 'lender2',
    lenderName: 'ICICI Bank',
    loanType: 'Personal',
    interestRate: 11.0,
    tenureOptions: [12, 24, 36, 48],
    maxAmount: 3000000,
    platformDiscount: 0.25,
    specialOffers: ['Quick disbursal'],
    eligibilityScore: 55,
  },
  {
    lenderId: 'lender3',
    lenderName: 'Axis Bank',
    loanType: 'Personal',
    interestRate: 10.75,
    tenureOptions: [12, 24, 36, 48, 60, 72],
    maxAmount: 4000000,
    platformDiscount: 0.75,
    specialOffers: ['Flexible repayment', 'Top-up available'],
    eligibilityScore: 65,
  },
  {
    lenderId: 'lender4',
    lenderName: 'SBI',
    loanType: 'Home',
    interestRate: 8.5,
    tenureOptions: [60, 120, 180, 240, 300],
    maxAmount: 10000000,
    platformDiscount: 0.5,
    specialOffers: ['Lowest interest rates'],
    eligibilityScore: 70,
  },
];

export async function getMatchingLendersFromDB(
  loanType: LoanType,
  userScore: number,
  creditGrade: string
): Promise<LoanOffer[]> {
  try {
    const db = await getDatabase();
    const lendersCollection = db.collection('lenders');
    
    // Find active lenders that offer this loan type
    const lenders = await lendersCollection.find({
      isActive: true,
      loanTypes: loanType,
    }).toArray();
    
    if (lenders.length === 0) {
      // Return mock lenders if no database lenders found
      return MOCK_LENDERS.filter(
        lender => lender.loanType === loanType && lender.eligibilityScore <= userScore
      ).sort((a, b) => {
        const rateDiff = a.interestRate - b.interestRate;
        if (rateDiff !== 0) return rateDiff;
        return b.platformDiscount - a.platformDiscount;
      });
    }
    
    // Convert database lenders to LoanOffer format
    const loanOffers: LoanOffer[] = lenders
      .map(lender => {
        // Generate loan offer based on lender data
        // In a real system, this would come from lender's loan products table
        const baseRate = 10.0 + (Math.random() * 3); // 10-13% range
        const discount = Math.random() * 1.5; // 0-1.5% discount
        
        return {
          lenderId: lender._id?.toString() || '',
          lenderName: lender.companyName || lender.name,
          loanType: loanType,
          interestRate: Math.round(baseRate * 100) / 100,
          tenureOptions: [12, 24, 36, 48, 60],
          maxAmount: 5000000,
          platformDiscount: Math.round(discount * 100) / 100,
          specialOffers: ['Competitive rates', 'Fast processing'],
          eligibilityScore: 50, // Default eligibility
        };
      })
      .filter(offer => offer.eligibilityScore <= userScore)
      .sort((a, b) => {
        const rateDiff = a.interestRate - b.interestRate;
        if (rateDiff !== 0) return rateDiff;
        return b.platformDiscount - a.platformDiscount;
      });
    
    // If no matching lenders from DB, return mock
    if (loanOffers.length === 0) {
      return MOCK_LENDERS.filter(
        lender => lender.loanType === loanType && lender.eligibilityScore <= userScore
      ).sort((a, b) => {
        const rateDiff = a.interestRate - b.interestRate;
        if (rateDiff !== 0) return rateDiff;
        return b.platformDiscount - a.platformDiscount;
      });
    }
    
    return loanOffers;
  } catch (error) {
    console.error('Error fetching lenders from DB:', error);
    // Fallback to mock lenders
    return MOCK_LENDERS.filter(
      lender => lender.loanType === loanType && lender.eligibilityScore <= userScore
    ).sort((a, b) => {
      const rateDiff = a.interestRate - b.interestRate;
      if (rateDiff !== 0) return rateDiff;
      return b.platformDiscount - a.platformDiscount;
    });
  }
}

