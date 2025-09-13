import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  const startTime = Date.now();

  try {
    // Test database connection speed
    const dbStart = Date.now();
    await connectToDatabase();
    const dbTime = Date.now() - dbStart;

    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      performance: {
        totalResponseTime: `${totalTime}ms`,
        databaseConnectionTime: `${dbTime}ms`
      }
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: String(error),
        responseTime: `${totalTime}ms`
      },
      { status: 500 }
    );
  }
}