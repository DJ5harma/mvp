import { NextResponse } from 'next/server';
import seedAll from '@/scripts/seed-all';

export async function POST() {
  try {
    await seedAll();
    return NextResponse.json({ 
      success: true, 
      message: 'Database seeded successfully with all test data' 
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

