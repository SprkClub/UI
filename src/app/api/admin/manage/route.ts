import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin, CORE_ADMIN_USERNAMES } from '@/lib/admin';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'sprkclub';

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

// Parse Twitter URL or username
function parseTwitterInput(input: string): string | null {
  const cleanInput = input.trim();
  
  // If it's a URL, extract username
  if (cleanInput.includes('x.com/') || cleanInput.includes('twitter.com/')) {
    const match = cleanInput.match(/(?:x\.com\/|twitter\.com\/)([a-zA-Z0-9_]+)/);
    return match ? match[1] : null;
  }
  
  // If it starts with @, remove it
  if (cleanInput.startsWith('@')) {
    return cleanInput.slice(1);
  }
  
  // Otherwise treat as username
  return cleanInput;
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
    const db = client.db(MONGODB_DB);
    
    // Get current admins from database
    const admins = await db.collection('admins').find({}).toArray();
    
    return NextResponse.json({ admins: admins.map(a => a.username) });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admins' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    const { input } = await req.json();
    
    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'Valid Twitter URL or username required' }, { status: 400 });
    }

    const username = parseTwitterInput(input);
    
    if (!username) {
      return NextResponse.json({ error: 'Invalid Twitter URL or username format' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    
    // Check if admin already exists
    const existingAdmin = await db.collection('admins').findOne({ username: username.toLowerCase() });
    
    if (existingAdmin) {
      return NextResponse.json({ error: 'Admin already exists' }, { status: 409 });
    }

    // Add new admin
    await db.collection('admins').insertOne({
      username: username.toLowerCase(),
      addedBy: session.user.username,
      addedAt: new Date(),
    });
    
    return NextResponse.json({ 
      message: 'Admin added successfully',
      username: username.toLowerCase()
    });
  } catch (error) {
    console.error('Error adding admin:', error);
    return NextResponse.json(
      { error: 'Failed to add admin' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
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

    const { username } = await req.json();
    
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    // Prevent removing hardcoded admins
    if (CORE_ADMIN_USERNAMES.includes(username.toLowerCase())) {
      return NextResponse.json({ error: 'Cannot remove core admin' }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    
    const result = await db.collection('admins').deleteOne({ username: username.toLowerCase() });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Admin removed successfully' });
  } catch (error) {
    console.error('Error removing admin:', error);
    return NextResponse.json(
      { error: 'Failed to remove admin' },
      { status: 500 }
    );
  }
}