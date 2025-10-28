import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'chain-recordings');

// Mock database - in production, use Prisma
// 使用 Map 来存储每个用户的录音，这样可以轻松替换
export const chainRecordings = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const songId = formData.get('songId') as string;
    const userId = formData.get('userId') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;

    if (!file || !songId || !userId || !startTime || !endTime) {
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
    const filename = `${songId}-${userId}-${Date.now()}.${fileExtension}`;
    const filepath = join(UPLOAD_DIR, filename);
    await writeFile(filepath, Buffer.from(buffer));

    // Create recording object - 使用唯一的 ID，包含时间范围以支持同一用户的多个部分
    const startTimeNum = parseFloat(startTime);
    const endTimeNum = parseFloat(endTime);
    const recordingId = `${songId}-${userId}-${startTime}-${endTime}-${Date.now()}`;
    const recording = {
      id: recordingId,
      songId,
      userId,
      startTime: startTimeNum,
      endTime: endTimeNum,
      audioUrl: `/uploads/chain-recordings/${filename}`,
      createdAt: new Date().toISOString(),
    };

    chainRecordings.set(recordingId, recording);
    console.log('Saved recording:', recordingId, 'Total recordings:', chainRecordings.size);

    return NextResponse.json(recording, { status: 201 });
  } catch (error) {
    console.error('Failed to upload chain recording:', error);
    return NextResponse.json(
      { error: 'Failed to upload chain recording' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const songId = request.nextUrl.searchParams.get('songId');

    let filtered = Array.from(chainRecordings.values());

    if (songId) {
      filtered = filtered.filter((r) => r.songId === songId);
    }

    // 只保留每个用户每个时间段的最新录音
    const latestRecordings = new Map<string, any>();
    
    filtered.forEach((recording) => {
      const key = `${recording.userId}-${recording.startTime}-${recording.endTime}`;
      const existing = latestRecordings.get(key);
      
      // 如果没有或者新的更新，就替换
      if (!existing || new Date(recording.createdAt) > new Date(existing.createdAt)) {
        latestRecordings.set(key, recording);
      }
    });

    const result = Array.from(latestRecordings.values());

    // Sort by startTime
    result.sort((a, b) => a.startTime - b.startTime);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch chain recordings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chain recordings' },
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

    let deletedCount = 0;
    const keysToDelete: string[] = [];

    // Find all recordings to delete
    chainRecordings.forEach((recording, key) => {
      if (recording.userId === userId) {
        if (!songId || recording.songId === songId) {
          keysToDelete.push(key);
          deletedCount++;
        }
      }
    });

    // Delete the recordings
    keysToDelete.forEach(key => {
      chainRecordings.delete(key);
    });

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} recording(s) for user ${userId}`
    });
  } catch (error) {
    console.error('Failed to delete chain recordings:', error);
    return NextResponse.json(
      { error: 'Failed to delete chain recordings' },
      { status: 500 }
    );
  }
}
