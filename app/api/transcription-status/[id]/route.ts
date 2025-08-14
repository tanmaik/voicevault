import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transcriptionId = params.id;
    
    const { blobs } = await list({
      prefix: `transcriptions/${transcriptionId}/`,
    });

    const completeBlob = blobs.find(blob => blob.pathname.endsWith('complete.json'));
    if (completeBlob) {
      const response = await fetch(completeBlob.url);
      const data = await response.json();
      return NextResponse.json(data);
    }

    const statusBlob = blobs.find(blob => blob.pathname.endsWith('status.json'));
    if (statusBlob) {
      const response = await fetch(statusBlob.url);
      const data = await response.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: 'Transcription not found', transcriptionId },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching transcription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcription status' },
      { status: 500 }
    );
  }
}