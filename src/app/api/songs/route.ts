import { NextRequest, NextResponse } from 'next/server';

// Mock database - in memory storage
const songs: any[] = [];

export async function GET() {
  try {
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

    // Convert backing track to base64
    const buffer = await backingTrack.arrayBuffer();
    const base64Audio = Buffer.from(buffer).toString('base64');
    const mimeType = backingTrack.type || 'audio/mpeg';

    // Create song object
    const song = {
      id: `song-${Date.now()}`,
      title,
      artist,
      duration,
      backingTrackUrl: `data:${mimeType};base64,${base64Audio}`,
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
