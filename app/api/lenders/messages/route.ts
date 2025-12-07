import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/mongodb';
import jwt from 'jsonwebtoken';
import { getChatSession, setChatSession } from '@/lib/db/redis';
import { ChatSession } from '@/types';
import { toObjectId, createIdQuery } from '@/lib/db/utils';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(token: string): { lenderId: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { lenderId: string; email: string };
  } catch {
    return null;
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

    const { userId, message, attachments, isSanctionLetter } = await request.json();

    if (!userId || !message) {
      return NextResponse.json(
        { error: 'Missing userId or message' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const messagesCollection = db.collection('lender_messages');

    // Convert IDs to ObjectIds for storage
    const lenderIdObj = toObjectId(decoded.lenderId);
    const userIdObj = toObjectId(userId);
    if (!lenderIdObj || !userIdObj) {
      return NextResponse.json({ error: 'Invalid lenderId or userId' }, { status: 400 });
    }

    // Save message - store IDs as ObjectIds
    const lenderMessage = {
      lenderId: lenderIdObj, // Store as ObjectId
      userId: userIdObj, // Store as ObjectId
      message,
      attachments: attachments || [],
      isSanctionLetter: isSanctionLetter || false,
      isLender: true, // Mark as lender message
      createdAt: new Date(),
    };

    await messagesCollection.insertOne(lenderMessage);

    // Update user's chat session if exists
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: userId });
    
    // Try to find and update chat session
    // In a real app, you'd maintain a mapping of userId to sessionId
    // For now, we'll just save the message

    return NextResponse.json({
      success: true,
      message: lenderMessage,
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
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

    const userId = request.nextUrl.searchParams.get('userId');

    const db = await getDatabase();
    const messagesCollection = db.collection('lender_messages');

    // Build query with ObjectId support
    const lenderIdObj = toObjectId(decoded.lenderId);
    if (!lenderIdObj) {
      return NextResponse.json({ error: 'Invalid lenderId' }, { status: 400 });
    }

    const query: Record<string, unknown> = createIdQuery('lenderId', decoded.lenderId);
    if (userId) {
      Object.assign(query, createIdQuery('userId', userId));
    }

    const messages = await messagesCollection
      .find(query)
      .sort({ createdAt: 1 })
      .toArray();

    // Format messages - mark lender messages and user replies
    const formattedMessages = messages.map(msg => ({
      ...msg,
      _id: msg._id?.toString(),
      isLender: msg.isLender !== false, // Default to true for lender messages
      createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : msg.createdAt,
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

