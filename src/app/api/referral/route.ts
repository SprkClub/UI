import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { MongoClient, ObjectId } from 'mongodb';
import crypto from 'crypto';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'launchpad';

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

// Generate unique referral code
function generateReferralCode(username: string): string {
  const hash = crypto.createHash('sha256').update(username + Date.now()).digest('hex');
  return hash.substring(0, 8).toUpperCase();
}

// GET - Get user's referral data and referred users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.username) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    
    // Get or create referral record
    const referralsCollection = db.collection('referrals');
    const tokensCollection = db.collection('tokens');
    
    let referralData = await referralsCollection.findOne({ 
      username: session.user.username 
    });
    
    // Create referral record if doesn't exist
    if (!referralData) {
      const referralCode = generateReferralCode(session.user.username);
      const newReferral = {
        username: session.user.username,
        userId: session.user.id,
        referralCode,
        totalReferred: 0,
        totalEarnings: 0,
        referredUsers: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await referralsCollection.insertOne(newReferral);
      referralData = newReferral;
    }

    // Get referred users with their token purchase data
    const referredUsers = [];
    for (const referredUser of referralData.referredUsers || []) {
      // Get token purchases by this referred user
      const userTokens = await tokensCollection.find({
        'twitterAuth.username': referredUser.username
      }).toArray();
      
      referredUsers.push({
        ...referredUser,
        tokensPurchased: userTokens.length,
        tokens: userTokens.map(token => ({
          _id: token._id,
          name: token.metadata?.name || 'Unnamed Token',
          symbol: token.metadata?.symbol || 'SYMBOL',
          createdAt: token.createdAt
        }))
      });
    }

    return NextResponse.json({
      success: true,
      referralData: {
        ...referralData,
        referredUsers,
        referralLink: `${process.env.NEXTAUTH_URL}/ref/${referralData.referralCode}`
      }
    });
  } catch (error) {
    console.error('Error fetching referral data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral data' },
      { status: 500 }
    );
  }
}

// POST - Process referral when new user signs up
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.username) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { referralCode } = await request.json();
    
    if (!referralCode) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const referralsCollection = db.collection('referrals');
    
    // Find the referrer
    const referrer = await referralsCollection.findOne({ referralCode });
    
    if (!referrer) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    // Check if user is trying to refer themselves
    if (referrer.username === session.user.username) {
      return NextResponse.json(
        { error: 'Cannot refer yourself' },
        { status: 400 }
      );
    }

    // Check if user is already referred by someone
    const existingReferral = await referralsCollection.findOne({
      'referredUsers.username': session.user.username
    });

    if (existingReferral) {
      return NextResponse.json(
        { error: 'User is already referred by someone else' },
        { status: 400 }
      );
    }

    // Add the new user to referrer's referred users
    const newReferredUser = {
      username: session.user.username,
      userId: session.user.id,
      name: session.user.name,
      referredAt: new Date(),
      tokensPurchased: 0
    };

    await referralsCollection.updateOne(
      { referralCode },
      {
        $push: { referredUsers: newReferredUser },
        $inc: { totalReferred: 1 },
        $set: { updatedAt: new Date() }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Referral processed successfully',
      referrerUsername: referrer.username
    });
  } catch (error) {
    console.error('Error processing referral:', error);
    return NextResponse.json(
      { error: 'Failed to process referral' },
      { status: 500 }
    );
  }
}