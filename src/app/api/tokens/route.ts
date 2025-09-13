import { NextRequest, NextResponse } from 'next/server';
import { getTokensCollection, getReferralsCollection } from '@/lib/mongodb';
import { apiCache, cacheKeys, getCachedOrFetch } from '@/utils/cache';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userWallet = url.searchParams.get('wallet');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Use advanced caching system
    const cacheKey = cacheKeys.tokens(userWallet || undefined, limit, offset);

    const tokens = await getCachedOrFetch(
      apiCache,
      cacheKey,
      async () => {
        const tokensCollection = await getTokensCollection();

        // Build optimized query
        const query: { userWallet?: string; approved?: boolean } = {};
        if (userWallet) {
          query.userWallet = userWallet;
        } else {
          query.approved = true;
        }

        // Ultra-fast query with minimal projection
        const rawTokens = await tokensCollection
          .find(query, {
            projection: {
              _id: 1,
              configAddress: 1,
              poolAddress: 1,
              userWallet: 1,
              createdAt: 1,
              'metadata.name': 1,
              'metadata.symbol': 1,
              'metadata.description': 1,
              'metadata.image': 1,
              twitterAuth: 1,
              featured: 1,
              approved: 1
            }
          })
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(offset)
          .toArray();

        // Transform tokens efficiently
        return rawTokens.map(token => ({
          _id: token._id,
          configAddress: token.configAddress,
          poolAddress: token.poolAddress,
          userWallet: token.userWallet,
          createdAt: token.createdAt,
          metadata: {
            name: token.metadata?.name || 'Unnamed Token',
            symbol: token.metadata?.symbol || 'TOKEN',
            description: token.metadata?.description || '',
            image: token.metadata?.image
          },
          twitterAuth: token.twitterAuth,
          featured: Boolean(token.featured),
          approved: Boolean(token.approved)
        }));
      },
      20000 // 20 second cache
    );

    return NextResponse.json({
      success: true,
      tokens,
      cached: apiCache.get(cacheKey) !== null
    });

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

    if (!tokenData.configAddress || !tokenData.userWallet) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const tokensCollection = await getTokensCollection();

    // Check if token already exists
    const existingToken = await tokensCollection.findOne({
      configAddress: tokenData.configAddress
    });

    if (existingToken) {
      return NextResponse.json(
        { error: 'Token already exists' },
        { status: 409 }
      );
    }

    // Create new token record
    const newToken = {
      ...tokenData,
      createdAt: new Date(),
      updatedAt: new Date(),
      approved: false, // Require admin approval
      featured: false
    };

    const result = await tokensCollection.insertOne(newToken);

    // Clear relevant caches
    apiCache.clear();

    // Background referral update (non-blocking)
    if (tokenData.twitterAuth?.username) {
      const referralsCollection = await getReferralsCollection();
      referralsCollection.updateOne(
        { 'referredUsers.username': tokenData.twitterAuth.username },
        {
          $inc: { 'referredUsers.$.tokensPurchased': 1 },
          $set: { updatedAt: new Date() }
        }
      ).catch(error => {
        console.error('Background referral update failed:', error);
      });
    }

    return NextResponse.json({
      success: true,
      tokenId: result.insertedId,
      message: 'Token created successfully'
    });

  } catch (error) {
    console.error('Error creating token:', error);
    return NextResponse.json(
      { error: 'Failed to create token' },
      { status: 500 }
    );
  }
}