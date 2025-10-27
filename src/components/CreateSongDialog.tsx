'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Part {
  name: string;
  startTime: number;
  endTime: number;
}

interface CreateSongDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSongCreated: () => void;
}

export default function CreateSongDialog({
  open,
  onOpenChange,
  onSongCreated,
}: CreateSongDialogProps) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [duration, setDuration] = useState('');
  const [backingTrackFile, setBackingTrackFile] = useState<File | null>(null);
  const [parts, setParts] = useState<Part[]>([
    { name: '高音', startTime: 0, endTime: 0 },
    { name: '中音', startTime: 0, endTime: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddPart = () => {
    setParts([...parts, { name: '', startTime: 0, endTime: 0 }]);
  };

  const handleRemovePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handlePartChange = (index: number, field: keyof Part, value: any) => {
    const newParts = [...parts];
    newParts[index] = { ...newParts[index], [field]: value };
    setParts(newParts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !artist || !duration || !backingTrackFile) {
      toast.error('请填写所有必填项');
      return;
    }

    if (parts.some((p) => !p.name || p.endTime <= p.startTime)) {
      toast.error('请检查声部信息');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('artist', artist);
      formData.append('duration', duration);
      formData.append('backingTrack', backingTrackFile);
      formData.append('parts', JSON.stringify(parts));

      const response = await fetch('/api/songs', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('歌曲已创建');
        onSongCreated();
        // Reset form
        setTitle('');
        setArtist('');
        setDuration('');
        setBackingTrackFile(null);
        setParts([
          { name: '高音', startTime: 0, endTime: 0 },
          { name: '中音', startTime: 0, endTime: 0 },
        ]);
      } else {
        toast.error('创建失败');
      }
    } catch (error) {
      console.error('Failed to create song:', error);
      toast.error('创建失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建新歌曲</DialogTitle>
          <DialogDescription>添加歌曲信息和声部</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">歌曲名称 *</Label>
              <Input
                id="title"
                placeholder="输入歌曲名称"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="artist">艺术家 *</Label>
              <Input
                id="artist"
                placeholder="输入艺术家名称"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">时长（秒）*</Label>
              <Input
                id="duration"
                type="number"
                placeholder="输入歌曲时长"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backing">伴奏文件 *</Label>
              <Input
                id="backing"
                type="file"
                accept="audio/*"
                onChange={(e) => setBackingTrackFile(e.target.files?.[0] || null)}
              />
              {backingTrackFile && (
                <p className="text-sm text-gray-500">{backingTrackFile.name}</p>
              )}
            </div>
          </div>

          {/* Parts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>声部 *</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddPart}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加声部
              </Button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {parts.map((part, index) => (
                <Card key={index} className="bg-slate-50">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-end gap-2">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">声部名称</Label>
                        <Input
                          placeholder="e.g., 高音、中音、低音"
                          value={part.name}
                          onChange={(e) =>
                            handlePartChange(index, 'name', e.target.value)
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemovePart(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">开始时间（秒）</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={part.startTime}
                          onChange={(e) =>
                            handlePartChange(index, 'startTime', parseFloat(e.target.value))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">结束时间（秒）</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={part.endTime}
                          onChange={(e) =>
                            handlePartChange(index, 'endTime', parseFloat(e.target.value))
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? '创建中...' : '创建'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
