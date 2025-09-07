import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'sprkclub';

if (!MONGODB_URI || typeof MONGODB_URI !== 'string') {
  throw new Error('MONGODB_URI environment variable is not defined or invalid');
}
const ADMIN_USERNAMES = ['iathulnambiar', 'elonmusk'];

interface GlobalMongo {
  _mongoClientPromise?: Promise<MongoClient>;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  const globalWithMongo = global as GlobalMongo;
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(MONGODB_URI);
  clientPromise = client.connect();
}

export async function GET() {
  try {
    // During build time, skip this API route
    if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
      return NextResponse.json({ error: 'Database not available during build' }, { status: 503 });
    }

    // Check admin authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = ADMIN_USERNAMES.includes(session.user.username.toLowerCase());
    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    
    // Get current date ranges
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - 7);

    // Aggregate stats
    const [totalTokens, totalUsers, tokensToday, tokensThisWeek] = await Promise.all([
      // Total tokens
      db.collection('tokens').countDocuments(),
      
      // Total users
      db.collection('users').countDocuments(),
      
      // Tokens created today
      db.collection('tokens').countDocuments({
        createdAt: { $gte: startOfToday }
      }),
      
      // Tokens created this week
      db.collection('tokens').countDocuments({
        createdAt: { $gte: startOfWeek }
      })
    ]);
    
    const stats = {
      totalTokens,
      totalUsers,
      tokensToday,
      tokensThisWeek
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}