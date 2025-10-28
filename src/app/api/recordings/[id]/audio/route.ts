import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const audio = await prisma.recordingAudio.findUnique({
      where: { recordingId: id },
    });

    if (!audio) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      );
    }

    // 将 base64 转换回二进制
    const buffer = Buffer.from(audio.audioData, 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': audio.mimeType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Failed to fetch audio:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audio' },
      { status: 500 }
    );
  }
}
