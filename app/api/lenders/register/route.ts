import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/mongodb';
import bcrypt from 'bcryptjs';
import { Lender } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, companyName, registrationNumber, loanTypes } = await request.json();

    if (!name || !email || !password || !companyName || !registrationNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const lendersCollection = db.collection('lenders');

    // Check if lender already exists
    const existing = await lendersCollection.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: 'Lender with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create lender
    const lender: Lender = {
      name,
      email,
      password: hashedPassword,
      companyName,
      registrationNumber,
      loanTypes: loanTypes || [],
      isActive: true,
      createdAt: new Date(),
    };

    await lendersCollection.insertOne(lender);

    return NextResponse.json({
      success: true,
      message: 'Lender registered successfully',
      lenderId: lender._id,
    });
  } catch (error) {
    console.error('Lender registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register lender' },
      { status: 500 }
    );
  }
}

