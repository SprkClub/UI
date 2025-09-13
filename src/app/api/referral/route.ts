import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getReferralsCollection } from '@/lib/mongodb';
import { apiCache, cacheKeys, getCachedOrFetch } from '@/utils/cache';
import crypto from 'crypto';

// Generate unique referral code
function generateReferralCode(username: string): string {
  const hash = crypto.createHash('sha256').update(username + Date.now()).digest('hex');
  return hash.substring(0, 8).toUpperCase();
}

// GET - Ultra-fast referral data retrieval
export async function GET() {
  try {
    // Get session directly
    const session = await getServerSession(authOptions);

    if (!session?.user?.username) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Use advanced caching system
    const cacheKey = cacheKeys.referral(session.user.username);

    const referralData = await getCachedOrFetch(
      apiCache,
      cacheKey,
      async () => {
        const referralsCollection = await getReferralsCollection();

        // Fast database query with optimized projection
        let data = await referralsCollection.findOne(
          { username: session.user.username! },
          {
            projection: {
              username: 1,
              referralCode: 1,
              referredUsers: 1,
              totalReferred: 1,
              totalEarnings: 1
            }
          }
        );

        // Create referral record if doesn't exist
        if (!data) {
          const referralCode = generateReferralCode(session.user.username!);
          const newReferral = {
            username: session.user.username!,
            referralCode,
            referredUsers: [],
            totalReferred: 0,
            totalEarnings: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const result = await referralsCollection.insertOne(newReferral);
          data = { ...newReferral, _id: result.insertedId };
        }

        return {
          username: data.username,
          referralCode: data.referralCode,
          referredUsers: (data.referredUsers || []).map((user: { username: string; referredAt: Date }) => ({
            username: user.username,
            referredAt: user.referredAt,
            tokensPurchased: 0 // Skip expensive counting for speed
          })),
          totalReferred: data.referredUsers?.length || 0,
          totalEarnings: data.totalEarnings || 0,
          referralUrl: `${process.env.NEXTAUTH_URL || 'https://sprkclub.fun'}/ref/${data.referralCode}`
        };
      },
      60000 // 1 minute cache
    );

    return NextResponse.json({
      success: true,
      referralData,
      cached: apiCache.get(cacheKey) !== null
    });

  } catch (error) {
    console.error('Referral API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update referral
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.username) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { referredUsername } = await request.json();

    if (!referredUsername) {
      return NextResponse.json(
        { error: 'Referred username required' },
        { status: 400 }
      );
    }

    // Clear cache for immediate update
    const cacheKey = cacheKeys.referral(session.user.username);
    apiCache.delete(cacheKey);

    const referralsCollection = await getReferralsCollection();

    // Update referral data
    await referralsCollection.updateOne(
      { username: session.user.username },
      {
        $addToSet: {
          referredUsers: {
            username: referredUsername,
            referredAt: new Date()
          }
        },
        $inc: { totalReferred: 1 },
        $set: { updatedAt: new Date() }
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Referral updated successfully'
    });

  } catch (error) {
    console.error('Referral update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}