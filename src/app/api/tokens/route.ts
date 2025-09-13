import { NextRequest, NextResponse } from 'next/server';
import { getTokensCollection, getReferralsCollection } from '@/lib/mongodb';

// Cache for frequently accessed data
interface TokenCacheData {
  data: Record<string, unknown>[];
  timestamp: number;
}

const tokenCache = new Map<string, TokenCacheData>();
const CACHE_TTL = 30000; // 30 seconds cache

function getCachedData(key: string) {
  const cached = tokenCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: Record<string, unknown>[]) {
  tokenCache.set(key, { data, timestamp: Date.now() });
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userWallet = url.searchParams.get('wallet');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // Create cache key
    const cacheKey = `tokens_${userWallet || 'all'}_${limit}_${offset}`;
    
    // Check cache first
    const cachedTokens = getCachedData(cacheKey);
    if (cachedTokens) {
      return NextResponse.json({ tokens: cachedTokens, success: true, cached: true });
    }
    
    const tokensCollection = await getTokensCollection();
    
    const query = userWallet ? { userWallet } : {};
    
    // Optimize query with projection to only fetch needed fields
    const tokens = await tokensCollection
      .find(query, {
        projection: {
          _id: 1,
          configAddress: 1,
          poolAddress: 1,
          userWallet: 1,
          createdAt: 1,
          updatedAt: 1,
          metadata: 1,
          twitterAuth: 1,
          featured: 1,
          approved: 1
        }
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .toArray();
    
    // Cache the result
    setCachedData(cacheKey, tokens);
    
    return NextResponse.json({ tokens, success: true, cached: false });
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
    
    const tokensCollection = await getTokensCollection();
    const referralsCollection = await getReferralsCollection();
    
    // Add additional fields
    const document = {
      ...tokenData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await tokensCollection.insertOne(document);
    
    // Clear relevant cache entries
    tokenCache.clear();
    
    // Update referral data asynchronously (don't block response)
    if (tokenData.twitterAuth?.username) {
      // Run referral update in background
      setImmediate(async () => {
        try {
          await referralsCollection.updateOne(
            { 'referredUsers.username': tokenData.twitterAuth?.username },
            {
              $inc: { 'referredUsers.$.tokensPurchased': 1 },
              $set: { updatedAt: new Date() }
            }
          );
          console.log(`Updated referral tracking for user ${tokenData.twitterAuth?.username}`);
        } catch (referralError) {
          console.error('Error updating referral data:', referralError);
        }
      });
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