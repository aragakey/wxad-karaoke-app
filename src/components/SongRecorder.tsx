'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, Mic, Square, Upload, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { getBestAudioMimeType, getFileExtension, convertBlobToWav, isIOS } from '@/lib/audioConverter';

interface Part {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  order: number;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number;
  backingTrackUrl: string;
  parts: Part[];
}

interface SongRecorderProps {
  song: Song;
  userId: string;
}

export default function SongRecorder({ song, userId }: SongRecorderProps) {
  const [selectedPart, setSelectedPart] = useState<Part | null>(song.parts?.[0] || null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingBacking, setIsPlayingBacking] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [backingVolume, setBackingVolume] = useState(0.5);
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/webm');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const backingAudioRef = useRef<HTMLAudioElement | null>(null);
  const recordedAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (backingAudioRef.current) {
      backingAudioRef.current.volume = backingVolume;
    }
  }, [backingVolume]);

  // 初始化时获取最佳的音频 MIME 类型
  useEffect(() => {
    const mimeType = getBestAudioMimeType();
    setAudioMimeType(mimeType);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 使用最佳的 MIME 类型创建 MediaRecorder
      const options: MediaRecorderOptions = {};
      if (audioMimeType && MediaRecorder.isTypeSupported(audioMimeType)) {
        options.mimeType = audioMimeType;
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        let audioBlob = new Blob(audioChunksRef.current, { type: audioMimeType });
        
        // iOS 上如果是 WebM，尝试转换为 WAV
        if (isIOS() && audioMimeType.includes('webm')) {
          try {
            audioBlob = await convertBlobToWav(audioBlob);
          } catch (error) {
            console.error('Failed to convert to WAV, using original blob:', error);
          }
        }
        
        setRecordedAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('开始录音');
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('无法访问麦克风');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success('录音已停止');
    }
  };

  const playBacking = () => {
    if (backingAudioRef.current) {
      if (isPlayingBacking) {
        backingAudioRef.current.pause();
        setIsPlayingBacking(false);
      } else {
        backingAudioRef.current.play();
        setIsPlayingBacking(true);
      }
    }
  };

  const playRecorded = () => {
    if (recordedAudioRef.current) {
      recordedAudioRef.current.play();
    }
  };

  const uploadRecording = async () => {
    if (!recordedAudio || !selectedPart) {
      toast.error('请先录音');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      const fileExtension = getFileExtension(audioMimeType);
      formData.append('file', recordedAudio, `recording.${fileExtension}`);
      formData.append('songId', song.id);
      formData.append('partId', selectedPart.id);
      formData.append('userId', userId);

      const response = await fetch('/api/recordings', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('录音已上传');
        setRecordedAudio(null);
        audioChunksRef.current = [];
      } else {
        toast.error('上传失败');
      }
    } catch (error) {
      console.error('Failed to upload recording:', error);
      toast.error('上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  if (!selectedPart) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-6 text-center">
          <p className="text-gray-400">该歌曲没有声部信息</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Part Selection */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">选择声部</CardTitle>
          <CardDescription>选择你要演唱的声部</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {song.parts.map((part) => (
              <Button
                key={part.id}
                variant={selectedPart.id === part.id ? 'default' : 'outline'}
                onClick={() => setSelectedPart(part)}
                className="justify-start"
              >
                {part.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Part Info */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">{selectedPart.name}</CardTitle>
          <CardDescription>
            时间: {selectedPart.startTime.toFixed(1)}s - {selectedPart.endTime.toFixed(1)}s
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Backing Track */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            伴奏
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <audio
            ref={backingAudioRef}
            src={song.backingTrackUrl}
            onEnded={() => setIsPlayingBacking(false)}
          />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">音量</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={backingVolume}
                onChange={(e) => setBackingVolume(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-400 w-8">{Math.round(backingVolume * 100)}%</span>
            </div>
          </div>
          <Button
            onClick={playBacking}
            className="w-full flex items-center justify-center gap-2"
            variant="outline"
          >
            {isPlayingBacking ? (
              <>
                <Pause className="w-4 h-4" />
                暂停
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                播放伴奏
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recording Controls */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Mic className="w-5 h-5" />
            录音
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
              >
                <Mic className="w-4 h-4" />
                开始录音
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
              >
                <Square className="w-4 h-4" />
                停止录音
              </Button>
            )}
          </div>

          {recordedAudio && (
            <div className="space-y-2 pt-4 border-t border-slate-700">
              <p className="text-sm text-gray-400">已录音</p>
              <audio
                ref={recordedAudioRef}
                src={URL.createObjectURL(recordedAudio)}
                controls
                className="w-full"
              />
              <div className="flex gap-2">
                <Button
                  onClick={playRecorded}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  播放
                </Button>
                <Button
                  onClick={uploadRecording}
                  disabled={isUploading}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? '上传中...' : '上传'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
