import { MongoClient, Db, Collection } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'launchpad';

interface GlobalMongo {
  _mongoClientPromise?: Promise<MongoClient>;
  _mongoClient?: MongoClient;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Ultra-fast connection settings optimized for speed
const connectionOptions = {
  maxPoolSize: 50, // Much larger pool for concurrent requests
  minPoolSize: 10, // More minimum connections ready
  serverSelectionTimeoutMS: 1000, // Even faster server selection
  socketTimeoutMS: 2000, // Shorter socket timeout
  connectTimeoutMS: 1000, // Faster initial connection
  maxIdleTimeMS: 30000, // Keep connections alive longer
  heartbeatFrequencyMS: 2000, // More frequent health checks
  retryWrites: true, // Enable retry writes
  retryReads: true, // Enable retry reads
};

if (process.env.NODE_ENV === 'development') {
  const globalWithMongo = global as GlobalMongo;
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI, connectionOptions);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(MONGODB_URI, connectionOptions);
  clientPromise = client.connect();
}

// Database connection helper
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  const client = await clientPromise;
  const db = client.db(MONGODB_DB);
  return { client, db };
}

// Collection helpers
export async function getTokensCollection(): Promise<Collection> {
  const { db } = await connectToDatabase();
  return db.collection('tokens');
}

export async function getReferralsCollection(): Promise<Collection> {
  const { db } = await connectToDatabase();
  return db.collection('referrals');
}

export async function getUsersCollection(): Promise<Collection> {
  const { db } = await connectToDatabase();
  return db.collection('users');
}

// Ensure indexes are created for optimal performance
export async function ensureIndexes() {
  try {
    const { db } = await connectToDatabase();
    
    // Tokens collection indexes
    const tokensCollection = db.collection('tokens');
    await tokensCollection.createIndex({ createdAt: -1 }); // For sorting by creation date
    await tokensCollection.createIndex({ userWallet: 1 }); // For filtering by wallet
    await tokensCollection.createIndex({ 'twitterAuth.username': 1 }); // For user lookups
    await tokensCollection.createIndex({ featured: 1, approved: 1 }); // For featured tokens
    
    // Referrals collection indexes
    const referralsCollection = db.collection('referrals');
    await referralsCollection.createIndex({ username: 1 }, { unique: true }); // Unique username
    await referralsCollection.createIndex({ referralCode: 1 }, { unique: true }); // Unique referral codes
    await referralsCollection.createIndex({ 'referredUsers.username': 1 }); // For referral lookups
    
    console.log('Database indexes ensured');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
}

export default clientPromise;