import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'launchpad';

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so the MongoClient is not constantly re-initialized
  if (!(global as any)._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI);
    (global as any)._mongoClientPromise = client.connect();
  }
  clientPromise = (global as any)._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable
  client = new MongoClient(MONGODB_URI);
  clientPromise = client.connect();
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userWallet = url.searchParams.get('wallet');
    
    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const collection = db.collection('tokens');
    
    const query = userWallet ? { userWallet } : {};
    const tokens = await collection.find(query).sort({ createdAt: -1 }).toArray();
    
    return NextResponse.json({ tokens, success: true });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tokenData = await request.json();
    
    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const collection = db.collection('tokens');
    
    // Add additional fields
    const document = {
      ...tokenData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await collection.insertOne(document);
    
    return NextResponse.json({ 
      success: true,
      tokenId: result.insertedId,
      message: 'Token data saved successfully'
    });
  } catch (error) {
    console.error('Error saving token:', error);
    return NextResponse.json(
      { error: 'Failed to save token data' },
      { status: 500 }
    );
  }
}