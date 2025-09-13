// Database indexing optimization for MongoDB collections
import { getTokensCollection, getReferralsCollection } from './mongodb';

// Create optimal database indexes for performance
export async function ensureIndexes() {
  try {
    const tokensCollection = await getTokensCollection();
    const referralsCollection = await getReferralsCollection();

    // Tokens collection indexes
    await tokensCollection.createIndex({ createdAt: -1 }); // For sorting by date
    await tokensCollection.createIndex({ userWallet: 1 }); // For user-specific queries
    await tokensCollection.createIndex({ 'twitterAuth.username': 1 }); // For referral tracking
    await tokensCollection.createIndex({ featured: 1, createdAt: -1 }); // For featured tokens
    await tokensCollection.createIndex({ approved: 1, createdAt: -1 }); // For approved tokens

    // Compound indexes for better performance
    await tokensCollection.createIndex({
      featured: 1,
      approved: 1,
      createdAt: -1
    });

    // Referrals collection indexes
    await referralsCollection.createIndex({ username: 1 }); // Primary lookup
    await referralsCollection.createIndex({ referralCode: 1 }); // For referral code lookup
    await referralsCollection.createIndex({ 'referredUsers.username': 1 }); // For referral tracking
    await referralsCollection.createIndex({ createdAt: -1 }); // For sorting
    await referralsCollection.createIndex({ updatedAt: -1 }); // For recent activity

    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating database indexes:', error);
  }
}

// Function to analyze query performance
export async function analyzeQueryPerformance() {
  try {
    const tokensCollection = await getTokensCollection();
    const referralsCollection = await getReferralsCollection();

    // Get basic collection information
    const tokenCount = await tokensCollection.countDocuments();
    const referralCount = await referralsCollection.countDocuments();

    console.log('Token collection count:', tokenCount);
    console.log('Referral collection count:', referralCount);

    return {
      tokenCount,
      referralCount,
      indexesCreated: true
    };
  } catch (error) {
    console.error('Error analyzing query performance:', error);
    return null;
  }
}