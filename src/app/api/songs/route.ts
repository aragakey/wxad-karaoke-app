import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'backing-tracks');

// Mock database - in production, use Prisma
const songs: any[] = [];

export async function GET() {
  try {
    // In production, fetch from database using Prisma
    return NextResponse.json(songs);
  } catch (error) {
    console.error('Failed to fetch songs:', error);
    return NextResponse.json({ error: 'Failed to fetch songs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const artist = formData.get('artist') as string;
    const duration = parseInt(formData.get('duration') as string);
    const backingTrack = formData.get('backingTrack') as File;
    const partsJson = formData.get('parts') as string;
    const parts = JSON.parse(partsJson);

    if (!title || !artist || !duration || !backingTrack) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Save backing track
    const buffer = await backingTrack.arrayBuffer();
    const filename = `${Date.now()}-${backingTrack.name}`;
    const filepath = join(UPLOAD_DIR, filename);
    await writeFile(filepath, Buffer.from(buffer));

    // Create song object
    const song = {
      id: `song-${Date.now()}`,
      title,
      artist,
      duration,
      backingTrackUrl: `/uploads/backing-tracks/${filename}`,
      parts: parts.map((part: any, index: number) => ({
        id: `part-${Date.now()}-${index}`,
        name: part.name,
        startTime: part.startTime,
        endTime: part.endTime,
        order: index,
      })),
      createdAt: new Date(),
    };

    songs.push(song);

    return NextResponse.json(song, { status: 201 });
  } catch (error) {
    console.error('Failed to create song:', error);
    return NextResponse.json(
      { error: 'Failed to create song' },
      { status: 500 }
    );
  }
}
