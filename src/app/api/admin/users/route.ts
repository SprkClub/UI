import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const ADMIN_USERNAMES = ['athulnambiar', 'elonmusk'];

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