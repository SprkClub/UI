import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getReferralsCollection, getTokensCollection } from '@/lib/mongodb';
import crypto from 'crypto';

// Cache for referral data
interface CacheData {
  data: Record<string, unknown>;
  timestamp: number;
}

const referralCache = new Map<string, CacheData>();
const CACHE_TTL = 60000; // 1 minute cache for referral data

function getCachedReferralData(key: string) {
  const cached = referralCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedReferralData(key: string, data: Record<string, unknown>) {
  referralCache.set(key, { data, timestamp: Date.now() });
}

// Generate unique referral code
function generateReferralCode(username: string): string {
  const hash = crypto.createHash('sha256').update(username + Date.now()).digest('hex');
  return hash.substring(0, 8).toUpperCase();
}

// GET - Get user's referral data and referred users
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.username) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check cache first
    const cacheKey = `referral_${session.user.username}`;
    const cachedData = getCachedReferralData(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        referralData: cachedData,
        cached: true
      });
    }

    const referralsCollection = await getReferralsCollection();
    const tokensCollection = await getTokensCollection();
    
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
      
      const result = await referralsCollection.insertOne(newReferral);
      referralData = await referralsCollection.findOne({ _id: result.insertedId });
    }

    // Optimize: Use aggregation pipeline to get token counts efficiently
    const referredUsernames = referralData?.referredUsers?.map((u: { username: string }) => u.username) || [];
    
    let tokenCounts: { [key: string]: number } = {};
    if (referredUsernames.length > 0) {
      const tokenCountsResult = await tokensCollection.aggregate([
        {
          $match: {
            'twitterAuth.username': { $in: referredUsernames }
          }
        },
        {
          $group: {
            _id: '$twitterAuth.username',
            count: { $sum: 1 }
          }
        }
      ]).toArray();
      
      tokenCounts = tokenCountsResult.reduce((acc: { [key: string]: number }, item) => {
        acc[item._id as string] = item.count as number;
        return acc;
      }, {} as { [key: string]: number });
    }

    // Build referred users with token counts
    const referredUsers = (referralData?.referredUsers || []).map((referredUser: { username: string; [key: string]: unknown }) => ({
      ...referredUser,
      tokensPurchased: tokenCounts[referredUser.username] || 0
    }));

    const result = {
      ...referralData,
      referredUsers,
      referralLink: `${process.env.NEXTAUTH_URL}/ref/${referralData?.referralCode}`
    };

    // Cache the result
    setCachedReferralData(cacheKey, result);

    return NextResponse.json({
      success: true,
      referralData: result,
      cached: false
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

    const referralsCollection = await getReferralsCollection();
    
    // Use a single aggregation to check both conditions efficiently
    const validationResult = await referralsCollection.aggregate([
      {
        $facet: {
          referrer: [
            { $match: { referralCode } }
          ],
          existingReferral: [
            { $match: { 'referredUsers.username': session.user.username } }
          ]
        }
      }
    ]).toArray();

    const { referrer, existingReferral } = validationResult[0];

    if (referrer.length === 0) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    const referrerData = referrer[0];

    // Check if user is trying to refer themselves
    if (referrerData.username === session.user.username) {
      return NextResponse.json(
        { error: 'Cannot refer yourself' },
        { status: 400 }
      );
    }

    if (existingReferral.length > 0) {
      const existing = existingReferral[0];
      if (existing.referralCode === referralCode) {
        return NextResponse.json(
          { error: 'You have already used this referral link' },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: 'You have already been referred by someone else' },
          { status: 400 }
        );
      }
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
      } as Record<string, unknown>
    );

    // Clear cache for the referrer
    referralCache.delete(`referral_${referrerData.username}`);

    return NextResponse.json({
      success: true,
      message: 'Referral processed successfully',
      referrerUsername: referrerData.username
    });
  } catch (error) {
    console.error('Error processing referral:', error);
    return NextResponse.json(
      { error: 'Failed to process referral' },
      { status: 500 }
    );
  }
}