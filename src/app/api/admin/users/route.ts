import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

if (!MONGODB_URI || typeof MONGODB_URI !== 'string') {
  throw new Error('MONGODB_URI environment variable is not defined or invalid');
}

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

    const adminCheck = await isAdmin(session.user.username);
    if (!adminCheck) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db('sprkclub');
    const collection = db.collection('users');
    
    const users = await collection.find({})
      .sort({ _id: -1 })
      .limit(100)
      .toArray();
    
    return NextResponse.json({ users, success: true });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}