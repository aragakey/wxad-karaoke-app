'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, Mic, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number;
  parts: any[];
}

interface SongListProps {
  songs: Song[];
  onSelectSong: (song: Song) => void;
  onSongUpdated: () => void;
}

export default function SongList({ songs, onSelectSong, onSongUpdated }: SongListProps) {
  const handleDelete = async (songId: string) => {
    if (!confirm('确定要删除这首歌曲吗？')) return;

    try {
      const response = await fetch(`/api/songs/${songId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('歌曲已删除');
        onSongUpdated();
      } else {
        toast.error('删除失败');
      }
    } catch (error) {
      console.error('Failed to delete song:', error);
      toast.error('删除失败');
    }
  };

  if (songs.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-6 text-center">
          <Music className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">暂无歌曲，请创建一首新歌曲</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {songs.map((song) => (
        <Card
          key={song.id}
          className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-colors cursor-pointer"
          onClick={() => onSelectSong(song)}
        >
          <CardHeader>
            <CardTitle className="text-lg text-white">{song.title}</CardTitle>
            <CardDescription className="text-gray-400">{song.artist}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-400">
              <p>时长: {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}</p>
              <p>声部: {song.parts?.length || 0} 个</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 flex items-center justify-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSong(song);
                  // Switch to record tab
                  const recordTab = document.querySelector('[value="record"]') as HTMLElement;
                  recordTab?.click();
                }}
              >
                <Mic className="w-4 h-4" />
                <span className="hidden sm:inline">录音</span>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(song.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
