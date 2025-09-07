import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { MongoClient, ObjectId } from 'mongodb';

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

async function checkAdminAccess(session: any): Promise<boolean> {
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

// GET - Fetch all tokens for admin review
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(await checkAdminAccess(session))) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status'); // 'pending', 'approved', 'featured', etc.
    
    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const collection = db.collection('tokens');
    
    let query = {};
    if (status === 'pending') {
      query = { $or: [{ approved: { $ne: true } }, { approved: { $exists: false } }] };
    } else if (status === 'approved') {
      query = { approved: true };
    } else if (status === 'featured') {
      query = { featured: true };
    }
    
    const tokens = await collection.find(query).sort({ createdAt: -1 }).toArray();
    
    return NextResponse.json({ tokens, success: true });
  } catch (error) {
    console.error('Error fetching admin tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}

// PUT - Update token status (approve, feature, etc.)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(await checkAdminAccess(session))) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { tokenId, action, value } = await request.json();
    
    if (!tokenId || !action) {
      return NextResponse.json(
        { error: 'Token ID and action are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const collection = db.collection('tokens');
    
    let updateQuery = {};
    
    switch (action) {
      case 'approve':
        updateQuery = { approved: true };
        break;
      case 'feature':
        updateQuery = { featured: true, approved: true }; // Featured tokens are automatically approved
        break;
      case 'unfeature':
        updateQuery = { featured: false };
        break;
      case 'reject':
        updateQuery = { approved: false };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(tokenId) },
      { 
        $set: {
          ...updateQuery,
          updatedAt: new Date(),
          lastModifiedBy: session.user.username
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: `Token ${action}d successfully`
    });
  } catch (error) {
    console.error('Error updating token:', error);
    return NextResponse.json(
      { error: 'Failed to update token' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a token (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(await checkAdminAccess(session))) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { tokenId } = await request.json();
    
    if (!tokenId) {
      return NextResponse.json(
        { error: 'Token ID is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const collection = db.collection('tokens');
    
    const result = await collection.deleteOne({ _id: new ObjectId(tokenId) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Token deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting token:', error);
    return NextResponse.json(
      { error: 'Failed to delete token' },
      { status: 500 }
    );
  }
}