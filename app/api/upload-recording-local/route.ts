import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

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

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `recording-${Date.now()}.webm`;
    
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      message: 'Recording saved successfully',
      fileName: fileName,
      path: `/uploads/${fileName}`,
    });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json(
      { error: 'Failed to save recording' },
      { status: 500 }
    );
  }
}