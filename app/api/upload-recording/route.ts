import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { waitUntil } from '@vercel/functions';
import { transcribeAudio, TranscriptionMetadata } from '@/app/lib/elevenlabs';

async function processTranscription(
  audioBuffer: Buffer,
  audioUrl: string,
  transcriptionId: string,
  mimeType: string
) {
  const statusMetadata: TranscriptionMetadata = {
    audioUrl,
    transcriptionId,
    status: 'processing',
    createdAt: new Date().toISOString(),
  };

  try {
    await put(
      `transcriptions/${transcriptionId}/status.json`,
      JSON.stringify(statusMetadata),
      {
        access: 'public',
        contentType: 'application/json',
      }
    );

    const transcript = await transcribeAudio(audioBuffer, mimeType);

    const completedMetadata: TranscriptionMetadata = {
      ...statusMetadata,
      status: 'complete',
      transcript,
      completedAt: new Date().toISOString(),
      numSpeakers: transcript.speakers?.length || 0,
    };

    await put(
      `transcriptions/${transcriptionId}/complete.json`,
      JSON.stringify(completedMetadata),
      {
        access: 'public',
        contentType: 'application/json',
      }
    );

    console.log(`Transcription completed for ${transcriptionId}`);
  } catch (error) {
    const errorMetadata: TranscriptionMetadata = {
      ...statusMetadata,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      completedAt: new Date().toISOString(),
    };

    await put(
      `transcriptions/${transcriptionId}/status.json`,
      JSON.stringify(errorMetadata),
      {
        access: 'public',
        contentType: 'application/json',
      }
    );

    console.error(`Transcription failed for ${transcriptionId}:`, error);
  }
}

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

    const timestamp = Date.now();
    const fileName = `recordings/${timestamp}-${file.name}`;
    const transcriptionId = `${timestamp}-transcript`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const blob = await put(fileName, buffer, {
      access: 'public',
      contentType: file.type || 'audio/webm',
    });

    const initialStatus: TranscriptionMetadata = {
      audioUrl: blob.url,
      transcriptionId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await put(
      `transcriptions/${transcriptionId}/status.json`,
      JSON.stringify(initialStatus),
      {
        access: 'public',
        contentType: 'application/json',
      }
    );

    waitUntil(
      processTranscription(buffer, blob.url, transcriptionId, file.type || 'audio/webm')
    );

    return NextResponse.json({
      success: true,
      message: 'Recording uploaded successfully to Vercel Blob',
      fileName: fileName,
      url: blob.url,
      transcriptionId,
      transcriptionStatus: 'pending',
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