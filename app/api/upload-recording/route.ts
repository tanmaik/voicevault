import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    const fileName = `recordings/${Date.now()}-${file.name}`;

    const blob = await put(fileName, file, {
      access: 'public',
    });

    return NextResponse.json({
      success: true,
      message: 'Recording uploaded successfully to Vercel Blob',
      fileName: fileName,
      url: blob.url,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload recording' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Upload endpoint ready' });
}