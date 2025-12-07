import { NextRequest, NextResponse } from 'next/server';
import { getChatSession } from '@/lib/db/redis';
import { getDatabase } from '@/lib/db/mongodb';
import { calculateUserScore } from '@/lib/scoring';
import { ChatSession, LoanReport, User, ExtractedData } from '@/types';
import { ObjectId } from 'mongodb';
import { toObjectId } from '@/lib/db/utils';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const session = (await getChatSession(sessionId)) as ChatSession | null;
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const db = await getDatabase();

    // Get user
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(session.userId) });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all uploaded documents - convert userId to ObjectId for query
    const documentsCollection = db.collection('kyc_documents');
    const userIdObj = toObjectId(session.userId);
    if (!userIdObj) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }
    const documents = await documentsCollection.find({ 
      $or: [
        { userId: session.userId },
        { userId: userIdObj }
      ]
    }).toArray();

    // Calculate user score
    const extractedData = documents.map(doc => doc.extractedData || {}) as ExtractedData[];
    const documentTypes = documents.map(doc => doc.type).filter(Boolean);
    
    const userDoc: User = {
      _id: user._id?.toString(),
      name: user.name,
      phone: user.phone,
      pan: user.pan,
      email: user.email,
      creditScore: user.creditScore,
      creditGrade: user.creditGrade,
      loanPurpose: user.loanPurpose,
      selectedLoanType: user.selectedLoanType,
    };
    const userScore = calculateUserScore(
      userDoc,
      extractedData,
      user.creditScore || 600,
      documentTypes
    );

    // Update user with score
    await usersCollection.updateOne(
      { _id: new ObjectId(session.userId) },
      {
        $set: {
          userScore: userScore.totalScore,
          kycStatus: 'completed',
          updatedAt: new Date(),
        },
      }
    );

    // Generate loan report
    const aadharDoc = documents.find(d => d.type === 'aadhar');
    const panDoc = documents.find(d => d.type === 'pan');
    const bankDoc = documents.find(d => d.type === 'bank_statement');
    const incomeDoc = documents.find(d => d.type === 'income_proof');

    // Convert IDs to ObjectIds for storage
    const lenderIdObj = toObjectId(session.context.selectedLender as string);
    if (!lenderIdObj) {
      return NextResponse.json({ error: 'Invalid lenderId' }, { status: 400 });
    }

    const report: LoanReport = {
      userId: session.userId,
      lenderId: session.context.selectedLender as string, // Keep as string in type, but store as ObjectId
      userIdentity: {
        name: aadharDoc?.extractedData?.name || user.name || '',
        dateOfBirth: aadharDoc?.extractedData?.dateOfBirth || '',
        address: aadharDoc?.extractedData?.address || '',
        aadharNumber: aadharDoc?.extractedData?.aadharNumber || '',
        panNumber: panDoc?.extractedData?.panNumber || user.pan || '',
      },
      kycResults: {
        status: 'verified',
        documentsSubmitted: documents.map(d => d.type),
        documentsVerified: documents.map(d => d.type),
      },
      creditScore: user.creditScore || 600,
      creditGrade: user.creditGrade || 'C',
      financialStability: {
        monthlyIncome: incomeDoc?.extractedData?.incomeSummary?.monthlyIncome || 0,
        monthlyExpenses: bankDoc?.extractedData?.expenseSummary?.monthlyExpenses || 0,
        savings: bankDoc?.extractedData?.savings || 0,
        emiObligations: bankDoc?.extractedData?.emiObligations?.totalEMI || 0,
        disposableIncome: (incomeDoc?.extractedData?.incomeSummary?.monthlyIncome || 0) -
          (bankDoc?.extractedData?.expenseSummary?.monthlyExpenses || 0) -
          (bankDoc?.extractedData?.emiObligations?.totalEMI || 0),
      },
      loanEligibility: {
        eligible: userScore.totalScore >= 50,
        maxLoanAmount: userScore.totalScore >= 80 ? 5000000 : userScore.totalScore >= 60 ? 3000000 : 1000000,
        recommendedTenure: userScore.totalScore >= 80 ? 60 : userScore.totalScore >= 60 ? 48 : 36,
        riskLevel: userScore.totalScore >= 70 ? 'low' : userScore.totalScore >= 50 ? 'medium' : 'high',
      },
      userScore: userScore.totalScore,
      createdAt: new Date(),
    };

    // Save report - convert IDs to ObjectIds
    const reportsCollection = db.collection('loan_reports');
    const reportToSave = {
      ...report,
      userId: userIdObj, // Store as ObjectId
      lenderId: lenderIdObj, // Store as ObjectId
    };
    const reportResult = await reportsCollection.insertOne(reportToSave);

    // Also create an application record for the lender to see
    const applicationsCollection = db.collection('applications');
    await applicationsCollection.insertOne({
      reportId: reportResult.insertedId,
      userId: userIdObj, // Store as ObjectId
      lenderId: lenderIdObj, // Store as ObjectId
      status: 'pending',
      userScore: userScore.totalScore,
      creditScore: user.creditScore || 600,
      creditGrade: user.creditGrade || 'C',
      loanType: user.selectedLoanType,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      report,
      userScore,
      lenderId: session.context.selectedLender,
      lenderName: session.context.selectedLenderName || 'Selected Lender',
      message: `KYC processing completed! Your loan application has been sent to ${session.context.selectedLenderName || 'the selected lender'}.`,
    });
  } catch (error) {
    console.error('Process KYC error:', error);
    return NextResponse.json(
      { error: 'Failed to process KYC' },
      { status: 500 }
    );
  }
}

