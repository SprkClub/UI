import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { MongoClient } from 'mongodb';

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

// Core admins (hardcoded)
const CORE_ADMINS = ['soumalyapaul19', 'iathulnambiar'];

async function checkAdminAccess(session: { user?: { username?: string } }): Promise<boolean> {
  if (!session?.user?.username) return false;
  
  const username = session.user.username;
  
  // Check core admins
  if (CORE_ADMINS.includes(username)) {
    return true;
  }
  
  // Check database admins
  try {
    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const adminCollection = db.collection('admins');
    
    const adminDoc = await adminCollection.findOne({ username });
    return !!adminDoc;
  } catch (error) {
    console.error('Error checking admin access:', error);
    return false;
  }
}

// GET - Fetch all referral data for admin view
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(await checkAdminAccess(session))) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const referralsCollection = db.collection('referrals');
    const tokensCollection = db.collection('tokens');
    
    // Get all referral data
    const allReferrals = await referralsCollection.find({}).sort({ totalReferred: -1 }).toArray();
    
    // Enhance with token data for each referred user
    const enhancedReferrals = [];
    
    for (const referral of allReferrals) {
      const enhancedReferredUsers = [];
      
      for (const referredUser of referral.referredUsers || []) {
        // Get tokens created by this referred user
        const userTokens = await tokensCollection.find({
          'twitterAuth.username': referredUser.username
        }).toArray();
        
        enhancedReferredUsers.push({
          ...referredUser,
          tokensPurchased: userTokens.length,
          tokens: userTokens.map(token => ({
            _id: token._id,
            name: token.metadata?.name || 'Unnamed Token',
            symbol: token.metadata?.symbol || 'SYMBOL',
            createdAt: token.createdAt,
            approved: token.approved || false,
            featured: token.featured || false
          }))
        });
      }
      
      enhancedReferrals.push({
        ...referral,
        referredUsers: enhancedReferredUsers,
        totalTokensCreated: enhancedReferredUsers.reduce((acc, user) => acc + user.tokensPurchased, 0)
      });
    }

    // Calculate summary statistics
    const totalReferrers = enhancedReferrals.length;
    const totalReferredUsers = enhancedReferrals.reduce((acc, r) => acc + r.totalReferred, 0);
    const totalTokensFromReferrals = enhancedReferrals.reduce((acc, r) => acc + r.totalTokensCreated, 0);
    
    return NextResponse.json({ 
      success: true,
      referrals: enhancedReferrals,
      stats: {
        totalReferrers,
        totalReferredUsers,
        totalTokensFromReferrals
      }
    });
  } catch (error) {
    console.error('Error fetching admin referral data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral data' },
      { status: 500 }
    );
  }
}