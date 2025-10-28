import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const songId = formData.get('songId') as string;
    const userId = formData.get('userId') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const startLineId = formData.get('startLineId') as string;
    const endLineId = formData.get('endLineId') as string;

    if (!file || !songId || !userId || !startTime || !endTime) {
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
    const recording = await prisma.chainRecording.create({
      data: {
        songId,
        userId,
        startTime: parseFloat(startTime),
        endTime: parseFloat(endTime),
        startLineId: startLineId ? parseInt(startLineId) : null,
        endLineId: endLineId ? parseInt(endLineId) : null,
        audioData: base64,
        mimeType,
        fileName: file.name,
      },
    });

    return NextResponse.json({
      id: recording.id,
      songId: recording.songId,
      userId: recording.userId,
      startTime: recording.startTime,
      endTime: recording.endTime,
      startLineId: recording.startLineId,
      endLineId: recording.endLineId,
      audioUrl: `/api/chain-recordings/${recording.id}/audio`,
      createdAt: recording.createdAt.toISOString(),
    }, { status: 201 });
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

    console.log('Fetching recordings for songId:', songId);
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    
    const recordings = await prisma.chainRecording.findMany({
      where: songId ? { songId } : undefined,
      orderBy: { startTime: 'asc' },
      select: {
        id: true,
        songId: true,
        userId: true,
        startTime: true,
        endTime: true,
        startLineId: true,
        endLineId: true,
        createdAt: true,
      },
    });

    console.log('Found recordings:', recordings.length);

    // 添加 audioUrl
    const result = recordings.map(r => ({
      ...r,
      audioUrl: `/api/chain-recordings/${r.id}/audio`,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch chain recordings:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        error: 'Failed to fetch chain recordings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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
    if (songId) {
      where.songId = songId;
    }

    const result = await prisma.chainRecording.deleteMany({ where });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Deleted ${result.count} recording(s) for user ${userId}`
    });
  } catch (error) {
    console.error('Failed to delete chain recordings:', error);
    return NextResponse.json(
      { error: 'Failed to delete chain recordings' },
      { status: 500 }
    );
  }
}
