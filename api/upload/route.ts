
/* 
  NOTE: To make this work in a real Vercel environment, you must:
  1. Install @vercel/blob: npm install @vercel/blob
  2. Create a Blob store in Vercel Dashboard
  3. Add BLOB_READ_WRITE_TOKEN to your environment variables.
*/

import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Put the file into Vercel Blob storage
    const blob = await put(file.name, file, {
      access: 'public',
      // In a real app, you might want to add contentDisposition or other options
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Config for larger uploads if needed
export const config = {
  api: {
    bodyParser: false,
  },
};
