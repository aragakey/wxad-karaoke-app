'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { mixAudioTracks } from '@/lib/audioMixer';

interface Recording {
  id: string;
  userId: string;
  audioUrl: string;
  startTime: number;
  endTime: number;
}

interface FullSongPlayerProps {
  backingTrackUrl: string;
  recordings: Recording[];
}

export default function FullSongPlayer({ backingTrackUrl, recordings }: FullSongPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMixing, setIsMixing] = useState(false);
  const [mixedAudioUrl, setMixedAudioUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef(false);
  const recordingIdsRef = useRef<string>(''); // 缓存已合成的录音 ID

  // 计算总时长
  useEffect(() => {
    if (recordings.length > 0) {
      const maxEndTime = Math.max(...recordings.map((r) => r.endTime));
      setDuration(maxEndTime);
    }
  }, [recordings]);

  // 按需合成音频
  const ensureMixedAudio = async () => {
    if (recordings.length === 0 || duration === 0) {
      toast.error('没有录音数据');
      return false;
    }

    // 生成当前录音的唯一标识
    const currentRecordingIds = recordings.map((r) => r.id).sort().join(',');

    // 如果已经合成过相同的录音，直接返回
    if (recordingIdsRef.current === currentRecordingIds && mixedAudioUrl) {
      return true;
    }

    recordingIdsRef.current = currentRecordingIds;
    setIsMixing(true);
    try {
      const mixedBlob = await mixAudioTracks(backingTrackUrl, recordings, duration);
      const url = URL.createObjectURL(mixedBlob);
      setMixedAudioUrl(url);
      toast.success('音频合成完成');
      return true;
    } catch (error) {
      console.error('Failed to mix audio:', error);
      toast.error('音频合成失败');
      return false;
    } finally {
      setIsMixing(false);
    }
  };

  // 更新整体音量
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // 播放/暂停逻辑
  useEffect(() => {
    isPlayingRef.current = isPlaying;

    if (isPlaying && audioRef.current && mixedAudioUrl) {
      audioRef.current.currentTime = currentTime;
      audioRef.current.play().catch((error) => {
        console.error('Failed to play audio:', error);
      });

      // 启动计时器
      const updateTimer = setInterval(() => {
        if (audioRef.current && isPlayingRef.current) {
          const newTime = audioRef.current.currentTime;
          const audioDuration = audioRef.current.duration;
          setCurrentTime(newTime);

          // 检查是否播放完成 - 使用音频元素的实际时长
          if (newTime >= audioDuration || newTime >= duration) {
            audioRef.current.pause();
            setIsPlaying(false);
          }
        }
      }, 100);

      updateIntervalRef.current = updateTimer;
    } else {
      // 暂停
      if (audioRef.current) {
        audioRef.current.pause();
      }

      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isPlaying, mixedAudioUrl, duration]);

  const togglePlay = async () => {
    if (isMixing) {
      toast.error('音频正在合成中，请稍候');
      return;
    }

    // 如果还没有合成，先合成
    if (!mixedAudioUrl) {
      const success = await ensureMixedAudio();
      if (!success) return;
      // 合成完成后，等待一下让 state 更新
      setTimeout(() => {
        setIsPlaying(true);
      }, 100);
      return;
    }

    setIsPlaying(!isPlaying);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);

    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      if (isPlaying) {
        audioRef.current.play().catch((error) => {
          console.error('Failed to play audio:', error);
        });
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">播放全曲</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 隐藏的音频元素 */}
        {mixedAudioUrl && (
          <audio
            ref={audioRef}
            src={mixedAudioUrl}
            onLoadedMetadata={(e) => {
              const audio = e.currentTarget;
              if (audio.duration && audio.duration !== duration) {
                setDuration(audio.duration);
              }
            }}
          />
        )}

        {/* 合成状态 */}
        {isMixing && (
          <div className="bg-blue-900/30 border border-blue-500/50 p-3 rounded-lg">
            <p className="text-blue-400 text-sm">正在合成音频...</p>
          </div>
        )}

        {/* 时间显示 */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">{formatTime(currentTime)}</span>
          <span className="text-gray-400 text-sm">{formatTime(duration)}</span>
        </div>

        {/* 进度条 */}
        <input
          type="range"
          min="0"
          max={duration}
          step="0.1"
          value={currentTime}
          onChange={handleTimeChange}
          disabled={isMixing || !mixedAudioUrl}
          className="w-full"
        />

        {/* 控制按钮 */}
        <div className="flex gap-2">
          <Button
            onClick={togglePlay}
            disabled={isMixing || recordings.length === 0}
            className="flex-1 flex items-center justify-center gap-2"
            variant="outline"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                暂停
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                播放
              </>
            )}
          </Button>
        </div>



        {/* 当前播放段落显示 */}
        {isPlaying && recordings.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-slate-700 pt-4">
            <p className="text-sm text-gray-400">当前播放段落：</p>
            {recordings.map((recording) => {
              const isCurrentlyPlaying = currentTime >= recording.startTime && currentTime < recording.endTime;
              return (
                <div
                  key={recording.id}
                  className={`p-2 rounded text-sm transition-colors ${
                    isCurrentlyPlaying
                      ? 'bg-purple-600/50 text-purple-200'
                      : 'bg-slate-900/50 text-gray-400'
                  }`}
                >
                  {recording.userId}: {recording.startTime.toFixed(0)}-{recording.endTime.toFixed(0)}s
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
