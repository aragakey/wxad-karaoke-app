import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'recordings');

// Mock database - in production, use Prisma
const recordings: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const songId = formData.get('songId') as string;
    const partId = formData.get('partId') as string;
    const userId = formData.get('userId') as string;

    if (!file || !songId || !partId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Save recording - 保留原始文件扩展名以支持多种格式
    const buffer = await file.arrayBuffer();
    const fileExtension = file.name.split('.').pop() || 'webm';
    const filename = `${Date.now()}-${userId}.${fileExtension}`;
    const filepath = join(UPLOAD_DIR, filename);
    await writeFile(filepath, Buffer.from(buffer));

    // Create recording object
    const recording = {
      id: `recording-${Date.now()}`,
      songId,
      partId,
      userId,
      audioUrl: `/uploads/recordings/${filename}`,
      duration: Math.round(file.size / 16000), // Rough estimate
      createdAt: new Date(),
    };

    recordings.push(recording);

    return NextResponse.json(recording, { status: 201 });
  } catch (error) {
    console.error('Failed to upload recording:', error);
    return NextResponse.json(
      { error: 'Failed to upload recording' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const songId = request.nextUrl.searchParams.get('songId');
    const partId = request.nextUrl.searchParams.get('partId');

    let filtered = recordings;

    if (songId) {
      filtered = filtered.filter((r) => r.songId === songId);
    }

    if (partId) {
      filtered = filtered.filter((r) => r.partId === partId);
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Failed to fetch recordings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recordings' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const songId = request.nextUrl.searchParams.get('songId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const initialLength = recordings.length;
    
    // Filter out recordings to delete
    const filtered = recordings.filter((recording) => {
      if (recording.userId !== userId) {
        return true;
      }
      if (songId && recording.songId !== songId) {
        return true;
      }
      return false;
    });

    const deletedCount = initialLength - filtered.length;
    
    // Replace the array contents
    recordings.length = 0;
    recordings.push(...filtered);

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} recording(s) for user ${userId}`
    });
  } catch (error) {
    console.error('Failed to delete recordings:', error);
    return NextResponse.json(
      { error: 'Failed to delete recordings' },
      { status: 500 }
    );
  }
}
