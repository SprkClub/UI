// Database index setup script
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'launchpad';

async function setupIndexes() {
  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(MONGODB_DB);

    // Tokens collection indexes
    const tokensCollection = db.collection('tokens');
    console.log('Creating tokens collection indexes...');

    await tokensCollection.createIndex({ createdAt: -1 });
    await tokensCollection.createIndex({ userWallet: 1 });
    await tokensCollection.createIndex({ 'twitterAuth.username': 1 });
    await tokensCollection.createIndex({ featured: 1, approved: 1 });
    await tokensCollection.createIndex({ approved: 1, createdAt: -1 });
    await tokensCollection.createIndex({ featured: 1, createdAt: -1 });

    // Compound index for optimal queries
    await tokensCollection.createIndex({
      featured: 1,
      approved: 1,
      createdAt: -1
    });

    // Referrals collection indexes
    const referralsCollection = db.collection('referrals');
    console.log('Creating referrals collection indexes...');

    await referralsCollection.createIndex({ username: 1 }, { unique: true });
    await referralsCollection.createIndex({ referralCode: 1 }, { unique: true });
    await referralsCollection.createIndex({ 'referredUsers.username': 1 });
    await referralsCollection.createIndex({ createdAt: -1 });
    await referralsCollection.createIndex({ updatedAt: -1 });

    console.log('✅ All database indexes created successfully!');

    // Get collection stats
    const tokenStats = await tokensCollection.stats();
    const referralStats = await referralsCollection.stats();

    console.log('Collection Statistics:');
    console.log(`Tokens: ${tokenStats.count || 0} documents`);
    console.log(`Referrals: ${referralStats.count || 0} documents`);

  } catch (error) {
    console.error('Error setting up indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

setupIndexes();