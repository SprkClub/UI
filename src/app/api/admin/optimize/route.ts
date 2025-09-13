import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { ensureIndexes, analyzeQueryPerformance } from '@/lib/dbIndexes';

// POST - Initialize database indexes for performance optimization
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.username) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!(await isAdmin(session.user.username))) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Create database indexes
    await ensureIndexes();

    return NextResponse.json({
      success: true,
      message: 'Database indexes optimized successfully'
    });

  } catch (error) {
    console.error('Error optimizing database:', error);
    return NextResponse.json(
      { error: 'Failed to optimize database' },
      { status: 500 }
    );
  }
}

// GET - Analyze query performance and index usage
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.username) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!(await isAdmin(session.user.username))) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const performanceStats = await analyzeQueryPerformance();

    return NextResponse.json({
      success: true,
      data: performanceStats
    });

  } catch (error) {
    console.error('Error analyzing performance:', error);
    return NextResponse.json(
      { error: 'Failed to analyze performance' },
      { status: 500 }
    );
  }
}