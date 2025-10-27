import { NextRequest, NextResponse } from 'next/server';

// Mock database
const songs: any[] = [];

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const index = songs.findIndex((s) => s.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    songs.splice(index, 1);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete song:', error);
    return NextResponse.json(
      { error: 'Failed to delete song' },
      { status: 500 }
    );
  }
}
