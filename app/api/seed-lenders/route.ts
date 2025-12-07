import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/mongodb';
import bcrypt from 'bcryptjs';

async function seedLenders() {
  try {
    const db = await getDatabase();
    const lendersCollection = db.collection('lenders');

    // Check if lenders already exist
    const existingLender = await lendersCollection.findOne({ email: 'demo@hdfc.com' });
    if (existingLender) {
      return { message: 'Lenders already seeded' };
    }

    const lenders = [
      {
        name: 'HDFC Bank',
        email: 'demo@hdfc.com',
        password: await bcrypt.hash('demo123', 10),
        companyName: 'HDFC Bank Limited',
        registrationNumber: 'HDFC001',
        loanTypes: ['Personal', 'Home', 'Vehicle', 'Business'],
        isActive: true,
        createdAt: new Date(),
      },
      {
        name: 'ICICI Bank',
        email: 'demo@icici.com',
        password: await bcrypt.hash('demo123', 10),
        companyName: 'ICICI Bank Limited',
        registrationNumber: 'ICICI001',
        loanTypes: ['Personal', 'Home', 'Education'],
        isActive: true,
        createdAt: new Date(),
      },
      {
        name: 'Axis Bank',
        email: 'demo@axis.com',
        password: await bcrypt.hash('demo123', 10),
        companyName: 'Axis Bank Limited',
        registrationNumber: 'AXIS001',
        loanTypes: ['Personal', 'Business', 'Vehicle'],
        isActive: true,
        createdAt: new Date(),
      },
    ];

    await lendersCollection.insertMany(lenders);
    return { message: 'Successfully seeded 3 lenders' };
  } catch (error) {
    console.error('Error seeding lenders:', error);
    throw error;
  }
}

export async function POST() {
  try {
    const result = await seedLenders();
    return NextResponse.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed lenders' },
      { status: 500 }
    );
  }
}

