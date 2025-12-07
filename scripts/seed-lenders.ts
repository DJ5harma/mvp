import { getDatabase } from '@/lib/db/mongodb';
import bcrypt from 'bcryptjs';
import "dotenv/config";

async function seedLenders() {
  try {
    const db = await getDatabase();
    const lendersCollection = db.collection('lenders');

    // Check if lenders already exist
    const existingLender = await lendersCollection.findOne({ email: 'demo@tata.com' });
    if (existingLender) {
      console.log('Lenders already seeded. Skipping...');
      return;
    }

    const lenders = [
      {
        name: 'Tata Capital Bank',
        email: 'demo@tata.com',
        password: await bcrypt.hash('demo123', 10),
        companyName: 'Tata Capital Bank Limited',
        registrationNumber: 'TATA001',
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
    console.log('✅ Successfully seeded 3 lenders:');
    console.log('  1. Tata Capital Bank - demo@tata.com / demo123');
    console.log('  2. ICICI Bank - demo@icici.com / demo123');
    console.log('  3. Axis Bank - demo@axis.com / demo123');
  } catch (error) {
    console.error('Error seeding lenders:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedLenders()
    .then(() => {
      console.log('Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export default seedLenders;

