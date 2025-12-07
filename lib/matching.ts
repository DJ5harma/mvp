import { LoanOffer, LoanType, User } from '@/types';

// Mock lender data - in production, this would come from database
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
  {
    lenderId: 'lender5',
    lenderName: 'Bajaj Finserv',
    loanType: 'Vehicle',
    interestRate: 9.5,
    tenureOptions: [12, 24, 36, 48, 60],
    maxAmount: 2000000,
    platformDiscount: 1.0,
    specialOffers: ['Fast approval', 'Online process'],
    eligibilityScore: 50,
  },
];

export function getMatchingLenders(
  loanType: LoanType,
  userScore: number,
  creditGrade: string
): LoanOffer[] {
  // Filter lenders by loan type and eligibility score
  const matching = MOCK_LENDERS.filter(
    lender => lender.loanType === loanType && lender.eligibilityScore <= userScore
  );
  
  // Sort by interest rate (ascending) and platform discount (descending)
  return matching.sort((a, b) => {
    const rateDiff = a.interestRate - b.interestRate;
    if (rateDiff !== 0) return rateDiff;
    return b.platformDiscount - a.platformDiscount;
  });
}

export function getLoanTypeInfo(loanType: LoanType): {
  description: string;
  benefits: string[];
} {
  const info: Record<LoanType, { description: string; benefits: string[] }> = {
    Personal: {
      description: 'Personal loans for your immediate financial needs without collateral.',
      benefits: [
        'Quick approval and disbursal',
        'No collateral required',
        'Flexible repayment options',
        'Competitive interest rates',
      ],
    },
    Business: {
      description: 'Business loans to grow and expand your enterprise.',
      benefits: [
        'High loan amounts',
        'Business-friendly terms',
        'Working capital support',
        'Tax benefits',
      ],
    },
    Home: {
      description: 'Home loans to make your dream home a reality.',
      benefits: [
        'Long repayment tenure',
        'Low interest rates',
        'Tax deductions available',
        'Flexible EMI options',
      ],
    },
    Vehicle: {
      description: 'Vehicle loans for cars, bikes, and commercial vehicles.',
      benefits: [
        'Fast processing',
        'Competitive rates',
        'Minimal documentation',
        'Quick disbursal',
      ],
    },
    Education: {
      description: 'Education loans to support your academic aspirations.',
      benefits: [
        'Moratorium period available',
        'Tax benefits',
        'No collateral for smaller amounts',
        'Flexible repayment',
      ],
    },
    Gold: {
      description: 'Gold loans secured against your gold assets.',
      benefits: [
        'Low interest rates',
        'Quick approval',
        'Flexible tenure',
        'Minimal documentation',
      ],
    },
  };
  
  return info[loanType];
}

