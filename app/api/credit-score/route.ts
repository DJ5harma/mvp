import { NextRequest, NextResponse } from 'next/server';
import { mockCreditScore, getCreditGrade } from '@/lib/scoring';

export async function POST(request: NextRequest) {
  try {
    const { phone, pan } = await request.json();

    if (!phone && !pan) {
      return NextResponse.json(
        { error: 'Phone number or PAN is required' },
        { status: 400 }
      );
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get credit score
    const creditScore = mockCreditScore(phone, pan);
    const creditGrade = getCreditGrade(creditScore);

    // Mock credit history
    const creditHistory = {
      totalAccounts: Math.floor(Math.random() * 10) + 5,
      activeAccounts: Math.floor(Math.random() * 5) + 2,
      closedAccounts: Math.floor(Math.random() * 5),
      totalInquiries: Math.floor(Math.random() * 8) + 1,
      recentInquiries: Math.floor(Math.random() * 3),
      paymentHistory: {
        onTime: Math.floor(Math.random() * 20) + 80,
        late: Math.floor(Math.random() * 10),
        missed: Math.floor(Math.random() * 3),
      },
      creditUtilization: Math.floor(Math.random() * 40) + 10,
      oldestAccount: Math.floor(Math.random() * 10) + 2,
      recentActivity: [
        {
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'Payment',
          amount: Math.floor(Math.random() * 50000) + 5000,
          status: 'On Time',
        },
        {
          date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'Credit Inquiry',
          lender: 'HDFC Bank',
          status: 'Approved',
        },
      ],
    };

    return NextResponse.json({
      success: true,
      creditScore,
      creditGrade,
      creditHistory,
      reportDate: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Credit score API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit score' },
      { status: 500 }
    );
  }
}

