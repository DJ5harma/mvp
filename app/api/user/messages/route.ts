import { NextRequest, NextResponse } from 'next/server';
import { getChatSession } from '@/lib/db/redis';
import { getDatabase } from '@/lib/db/mongodb';
import { ChatSession } from '@/types';
import { toObjectId, createIdQuery } from '@/lib/db/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const lenderId = searchParams.get('lenderId');
    const userIdParam = searchParams.get('userId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    // Try to get session, but if it doesn't exist, try to find user by userId from query params
    let session = (await getChatSession(sessionId)) as ChatSession | null;
    
    // If no session but userId provided, create a temporary session context
    if (!session && userIdParam) {
      session = {
        sessionId,
        userId: userIdParam,
        messages: [],
        currentStep: 'report_generated',
        context: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Session not found or user not identified' }, { status: 404 });
    }

    const db = await getDatabase();
    const messagesCollection = db.collection('lender_messages');
    const lendersCollection = db.collection('lenders');

    // Get lender name
    let lenderName = 'Lender';
    if (lenderId) {
      try {
        const lenderIdObj = toObjectId(lenderId);
        if (lenderIdObj) {
          const lender = await lendersCollection.findOne({ _id: lenderIdObj });
          lenderName = lender?.companyName || lender?.name || 'Lender';
        }
      } catch (error) {
        console.error('Error fetching lender:', error);
      }
    }

    // Build query with ObjectId support
    const query: Record<string, unknown> = createIdQuery('userId', session.userId);
    if (lenderId) {
      Object.assign(query, createIdQuery('lenderId', lenderId));
    }

    const messages = await messagesCollection
      .find(query)
      .sort({ createdAt: 1 })
      .toArray();

    // Mark messages as lender or user messages
    const formattedMessages = messages.map(msg => ({
      ...msg,
      _id: msg._id?.toString(),
      isLender: true,
      lenderName: lenderName,
      createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : msg.createdAt,
    }));

    return NextResponse.json({ 
      messages: formattedMessages,
      lenderName 
    });
  } catch (error) {
    console.error('Get user messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, lenderId, message, userId } = await request.json();

    if (!sessionId || !lenderId || !message) {
      return NextResponse.json(
        { error: 'Missing sessionId, lenderId, or message' },
        { status: 400 }
      );
    }

    // Try to get session, but if it doesn't exist, use userId directly
    let session = (await getChatSession(sessionId)) as ChatSession | null;
    
    // If no session but userId provided, create a temporary session context
    if (!session && userId) {
      session = {
        sessionId,
        userId: userId,
        messages: [],
        currentStep: 'report_generated',
        context: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Session not found or user not identified' }, { status: 404 });
    }

    const db = await getDatabase();
    const messagesCollection = db.collection('lender_messages');

    // Convert IDs to ObjectIds for storage
    const lenderIdObj = toObjectId(lenderId);
    const userIdObj = toObjectId(session.userId);
    if (!lenderIdObj || !userIdObj) {
      return NextResponse.json({ error: 'Invalid lenderId or userId' }, { status: 400 });
    }

    // Save user's reply message - store IDs as ObjectIds
    // We'll mark it as isLender: false to distinguish from lender messages
    const userMessage = {
      lenderId: lenderIdObj, // Store as ObjectId
      userId: userIdObj, // Store as ObjectId
      message,
      isLender: false, // User's message
      createdAt: new Date(),
    };

    await messagesCollection.insertOne(userMessage);

    return NextResponse.json({
      success: true,
      message: userMessage,
    });
  } catch (error) {
    console.error('Send user message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

