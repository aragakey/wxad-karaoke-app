import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // 将文件转换为 base64 存储在数据库中
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = file.type || 'audio/webm';

    // 创建数据库记录
    const recording = await prisma.recording.create({
      data: {
        songId,
        partId,
        userId,
        audioUrl: `/api/recordings/${Date.now()}/audio`,
        duration: Math.round(file.size / 16000),
      },
    });

    // 存储音频数据到单独的表（可选）
    await prisma.recordingAudio.create({
      data: {
        recordingId: recording.id,
        audioData: base64,
        mimeType,
        fileName: file.name,
      },
    });

    return NextResponse.json({
      id: recording.id,
      songId: recording.songId,
      partId: recording.partId,
      userId: recording.userId,
      audioUrl: `/api/recordings/${recording.id}/audio`,
      duration: recording.duration,
      createdAt: recording.createdAt.toISOString(),
    }, { status: 201 });
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

    const where: any = {};
    if (songId) where.songId = songId;
    if (partId) where.partId = partId;

    const recordings = await prisma.recording.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        songId: true,
        partId: true,
        userId: true,
        duration: true,
        createdAt: true,
      },
    });

    // 添加 audioUrl
    const result = recordings.map(r => ({
      ...r,
      audioUrl: `/api/recordings/${r.id}/audio`,
    }));

    return NextResponse.json(result);
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

    const where: any = { userId };
    if (songId) where.songId = songId;

    const result = await prisma.recording.deleteMany({ where });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Deleted ${result.count} recording(s) for user ${userId}`
    });
  } catch (error) {
    console.error('Failed to delete recordings:', error);
    return NextResponse.json(
      { error: 'Failed to delete recordings' },
      { status: 500 }
    );
  }
}
