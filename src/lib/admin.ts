import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'sprkclub';
const CORE_ADMIN_USERNAMES = ['soumalyapaul19', 'iathulnambiar'];

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

export async function isAdmin(username: string): Promise<boolean> {
  try {
    const lowercaseUsername = username.toLowerCase();
    
    // Check core admins first
    if (CORE_ADMIN_USERNAMES.includes(lowercaseUsername)) {
      return true;
    }
    
    // Check database admins
    const mongoClient = await clientPromise;
    const db = mongoClient.db(MONGODB_DB);
    
    const dbAdmin = await db.collection('admins').findOne({ 
      username: lowercaseUsername 
    });
    
    return !!dbAdmin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    // Fallback to core admins only
    return CORE_ADMIN_USERNAMES.includes(username.toLowerCase());
  }
}

export function isCoreAdmin(username: string): boolean {
  return CORE_ADMIN_USERNAMES.includes(username.toLowerCase());
}

export { CORE_ADMIN_USERNAMES };