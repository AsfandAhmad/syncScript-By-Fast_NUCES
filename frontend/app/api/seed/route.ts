import { NextRequest, NextResponse } from 'next/server';
import seedDatabase from '@/lib/seed-data';

/**
 * POST /api/seed
 * Seed the database with dummy data
 * Only available in development
 */
export async function POST(request: NextRequest) {
  try {
    // Security: Only allow in development or with valid token
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('authorization');
      const expectedToken = process.env.SEED_API_TOKEN;

      if (!authHeader || !expectedToken || authHeader !== `Bearer ${expectedToken}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    await seedDatabase();

    return NextResponse.json(
      {
        success: true,
        message: 'Database seeded successfully with dummy data',
        data: {
          vaults: 3,
          members: 4,
          sources: 7,
          annotations: 5,
          files: 5,
          activityLogs: 10,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/seed
 * Check seeding status
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Seed API is available',
    usage: 'POST /api/seed to seed the database',
    environment: process.env.NODE_ENV,
  });
}
