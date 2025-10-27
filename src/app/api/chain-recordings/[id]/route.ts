import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { chainRecordings } from '../route';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'chain-recordings');

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: recordingId } = await params;

    console.log('DELETE request for recording:', recordingId);
    console.log('Available recordings:', Array.from(chainRecordings.keys()));

    if (!recordingId) {
      return NextResponse.json(
        { error: 'Missing recording ID' },
        { status: 400 }
      );
    }

    // 获取要删除的录音信息
    const recording = chainRecordings.get(recordingId);
    
    if (!recording) {
      console.log('Recording not found:', recordingId);
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      );
    }
    
    console.log('Deleting recording:', recording);

    // 删除文件
    try {
      const filename = recording.audioUrl.split('/').pop();
      const filepath = join(UPLOAD_DIR, filename);
      
      if (existsSync(filepath)) {
        await unlink(filepath);
      }
    } catch (error) {
      console.error('Failed to delete audio file:', error);
      // 继续删除数据库记录，即使文件删除失败
    }

    // 从内存中删除
    chainRecordings.delete(recordingId);

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
