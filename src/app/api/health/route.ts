import { NextResponse } from 'next/server';
import { ensureIndexes } from '@/lib/mongodb';

export async function GET() {
  try {
    // Ensure database indexes on health check
    await ensureIndexes();
    
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      indexes: 'ensured'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed'
      },
      { status: 500 }
    );
  }
}