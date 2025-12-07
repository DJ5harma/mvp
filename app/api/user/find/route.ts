import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Missing phone number' }, { status: 400 });
    }

    const db = await getDatabase();
    const usersCollection = db.collection('users');

    // Find user by phone
    const user = await usersCollection.findOne({ phone });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        _id: user._id?.toString(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        creditScore: user.creditScore,
        creditGrade: user.creditGrade,
      },
    });
  } catch (error) {
    console.error('Find user error:', error);
    return NextResponse.json(
      { error: 'Failed to find user' },
      { status: 500 }
    );
  }
}

