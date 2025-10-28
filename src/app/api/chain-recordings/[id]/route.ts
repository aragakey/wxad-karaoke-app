import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: recordingId } = await params;

    if (!recordingId) {
      return NextResponse.json(
        { error: 'Missing recording ID' },
        { status: 400 }
      );
    }

    // 删除录音
    const result = await prisma.chainRecording.delete({
      where: { id: recordingId },
    });

    return NextResponse.json({
      success: true,
      message: `Recording ${recordingId} deleted successfully`
    });
  } catch (error) {
    console.error('Failed to delete recording:', error);
    return NextResponse.json(
      { error: 'Failed to delete recording' },
      { status: 500 }
    );
  }
}
