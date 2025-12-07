import { NextRequest, NextResponse } from 'next/server';
import { getChatSession } from '@/lib/db/redis';
import { getDatabase } from '@/lib/db/mongodb';
import { ChatSession } from '@/types';
import { ObjectId } from 'mongodb';
import { toObjectId, createIdQuery } from '@/lib/db/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const db = await getDatabase();
    const applicationsCollection = db.collection('applications');
    const reportsCollection = db.collection('loan_reports');
    const lendersCollection = db.collection('lenders');
    const usersCollection = db.collection('users');

    // Try to get session, but if it doesn't exist, try to find user by userId from query params
    let session = (await getChatSession(sessionId)) as ChatSession | null;
    const userIdParam = searchParams.get('userId');
    
    // Determine target userId - prioritize userId param, then session userId, then try to find by phone/pan
    let targetUserId: string | undefined;
    
    if (userIdParam) {
      // userId provided directly in query params - use it
      targetUserId = userIdParam;
    } else if (session?.userId) {
      // userId from session
      targetUserId = typeof session.userId === 'string' ? session.userId : session.userId.toString();
    } else if (session?.context) {
      // Try to find user by phone/pan from context
      const phone = session.context?.phone as string | undefined;
      const pan = session.context?.pan as string | undefined;
      
      if (phone || pan) {
        const userQuery: Record<string, unknown> = {};
        if (phone) userQuery.phone = phone;
        if (pan) userQuery.pan = pan;
        
        const user = await usersCollection.findOne(userQuery);
        if (user && user._id) {
          targetUserId = user._id.toString();
        }
      }
    }
    
    if (!targetUserId) {
      // Return empty array instead of error - user might not have applications yet
      return NextResponse.json({ applications: [] });
    }

    // Get all applications for this user - use ObjectId query
    const userIdQuery = createIdQuery('userId', targetUserId);
    
    const applications = await applicationsCollection
      .find(userIdQuery)
      .sort({ createdAt: -1 })
      .toArray();

    // Enrich with report and lender data
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        const report = app.reportId 
          ? await reportsCollection.findOne({ 
              _id: app.reportId instanceof ObjectId ? app.reportId : new ObjectId(app.reportId) 
            })
          : null;
        
        let lender = null;
        if (app.lenderId) {
          try {
            const lenderIdObj = toObjectId(app.lenderId);
            if (lenderIdObj) {
              lender = await lendersCollection.findOne({ _id: lenderIdObj });
            }
          } catch (error) {
            console.error('Error finding lender:', error);
          }
        }
        
        return {
          _id: app._id?.toString(),
          userId: app.userId,
          lenderId: app.lenderId,
          lenderName: lender?.companyName || lender?.name || 'Unknown Lender',
          status: app.status || 'pending',
          userScore: app.userScore || 0,
          creditScore: app.creditScore || 0,
          creditGrade: app.creditGrade || 'C',
          loanType: app.loanType || 'Personal',
          report: report ? {
            loanEligibility: report.loanEligibility,
            financialStability: report.financialStability,
            userScore: report.userScore,
          } : null,
          lenderMessage: app.lenderMessage,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt || app.createdAt,
        };
      })
    );

    return NextResponse.json({ applications: enrichedApplications });
  } catch (error) {
    console.error('Get user applications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

