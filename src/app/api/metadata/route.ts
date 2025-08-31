import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const metadata = await request.json();
    
    // For now, we'll store the metadata in a simple way
    // In production, you might want to use IPFS, Arweave, or your own storage
    const metadataId = Date.now().toString();
    
    // Here you would typically upload to IPFS or store on your server
    // For this example, we'll create a simple endpoint that returns the metadata
    const metadataUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/metadata/${metadataId}`;
    
    // Store in your database or file system
    // This is a simplified version - in production you'd use a proper database
    
    return NextResponse.json({ 
      metadataUri,
      metadata,
      success: true 
    });
  } catch (error) {
    console.error('Error storing metadata:', error);
    return NextResponse.json(
      { error: 'Failed to store metadata' },
      { status: 500 }
    );
  }
}