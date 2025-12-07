import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { toObjectId, createIdQuery } from '@/lib/db/utils';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(token: string): { lenderId: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { lenderId: string; email: string };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = await getDatabase();
    const applicationsCollection = db.collection('applications');
    const reportsCollection = db.collection('loan_reports');
    const usersCollection = db.collection('users');

    // Get applications for this lender - use ObjectId query
    const lenderIdObj = toObjectId(decoded.lenderId);
    if (!lenderIdObj) {
      return NextResponse.json({ error: 'Invalid lenderId' }, { status: 400 });
    }

    const applications = await applicationsCollection
      .find(createIdQuery('lenderId', decoded.lenderId))
      .sort({ createdAt: -1 })
      .toArray();

    // Enrich with report and user data
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        const report = app.reportId 
          ? await reportsCollection.findOne({ _id: app.reportId instanceof ObjectId ? app.reportId : new ObjectId(app.reportId) })
          : null;
        const userIdObj = toObjectId(app.userId);
        const user = userIdObj 
          ? await usersCollection.findOne({ _id: userIdObj })
          : null;
        
        return {
          ...app,
          report,
          user: user ? {
            name: user.name,
            email: user.email,
            phone: user.phone,
          } : null,
        };
      })
    );

    return NextResponse.json({ applications: enrichedApplications });
  } catch (error) {
    console.error('Get applications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { applicationId, action, message } = await request.json();

    if (!applicationId || !action) {
      return NextResponse.json({ error: 'Missing applicationId or action' }, { status: 400 });
    }

    const db = await getDatabase();
    const applicationsCollection = db.collection('applications');

    const updateData: Record<string, unknown> = {
      status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending',
      updatedAt: new Date(),
    };

    if (message) {
      updateData.lenderMessage = message;
    }

    const applicationIdObj = toObjectId(applicationId);
    const lenderIdObj = toObjectId(decoded.lenderId);
    if (!applicationIdObj || !lenderIdObj) {
      return NextResponse.json({ error: 'Invalid applicationId or lenderId' }, { status: 400 });
    }

    await applicationsCollection.updateOne(
      { 
        _id: applicationIdObj,
        ...createIdQuery('lenderId', decoded.lenderId)
      },
      { $set: updateData }
    );

    return NextResponse.json({ 
      success: true, 
      message: `Application ${action === 'approve' ? 'approved' : 'rejected'} successfully` 
    });
  } catch (error) {
    console.error('Update application error:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}

