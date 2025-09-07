import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'launchpad';

interface GlobalMongo {
  _mongoClientPromise?: Promise<MongoClient>;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so the MongoClient is not constantly re-initialized
  const globalWithMongo = global as GlobalMongo;
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
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

interface TokenData {
  configAddress: string;
  poolAddress?: string;
  poolTransactionSignature?: string;
  configTransactionSignature: string;
  userWallet?: string;
  network?: string;
  twitterAuth?: {
    username: string;
    userId: string;
    name: string;
    email?: string;
  };
  metadata?: {
    name: string;
    symbol: string;
    description: string;
    image?: string;
    externalUrl?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const tokenData: TokenData = await request.json();
    
    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const tokensCollection = db.collection('tokens');
    const referralsCollection = db.collection('referrals');
    
    // Add additional fields
    const document = {
      ...tokenData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await tokensCollection.insertOne(document);
    
    // Update referral data if this user was referred
    if (tokenData.twitterAuth?.username) {
      try {
        // Find any referral record where this user was referred
        const referralRecord = await referralsCollection.findOne({
          'referredUsers.username': tokenData.twitterAuth.username
        });
        
        if (referralRecord) {
          // Update the specific referred user's token count
          await referralsCollection.updateOne(
            { 
              _id: referralRecord._id,
              'referredUsers.username': tokenData.twitterAuth.username 
            },
            { 
              $inc: { 'referredUsers.$.tokensPurchased': 1 },
              $set: { updatedAt: new Date() }
            }
          );
          
          console.log(`Updated referral tracking for user ${tokenData.twitterAuth.username}`);
        }
      } catch (referralError) {
        console.error('Error updating referral data:', referralError);
        // Don't fail token creation if referral update fails
      }
    }
    
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