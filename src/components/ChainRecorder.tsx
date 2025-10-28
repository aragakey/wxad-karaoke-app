'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, Square, Upload, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import KaraokeDisplay from './KaraokeDisplay';
import { getUserLyricSegments, getTimeRangeByLineIds, getLyricsByRange } from '@/lib/lyrics';
import { getBestAudioMimeType, getFileExtension, convertBlobToWav, isIOS } from '@/lib/audioConverter';

interface Recording {
  id: string;
  userId: string;
  audioUrl: string;
  startTime: number;
  endTime: number;
  createdAt: string;
}

interface ChainRecorderProps {
  song: {
    id: string;
    title: string;
    artist: string;
    backingTrackUrl: string;
  };
  userId: string;
}

interface SegmentRecordingState {
  isRecording: boolean;
  recordedAudio: Blob | null;
  recordedAudioUrl: string | null;
  recordingTime: number;
  currentBackingTime: number;
}

export default function ChainRecorder({ song, userId }: ChainRecorderProps) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(null);
  const [recordingPlaybackTimes, setRecordingPlaybackTimes] = useState<Map<string, number>>(new Map());
  const [recordingDurations, setRecordingDurations] = useState<Map<string, number>>(new Map());
  const [rerecordingSegments, setRerecordingSegments] = useState<Set<number>>(new Set());
  const [playingWithBackingId, setPlayingWithBackingId] = useState<string | null>(null);
  const [backingPlaybackTime, setBackingPlaybackTime] = useState(0);
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/webm');

  // 获取用户的歌词段落
  const userSegments = getUserLyricSegments(userId);

  // 初始化时获取最佳的音频 MIME 类型
  useEffect(() => {
    const mimeType = getBestAudioMimeType();
    setAudioMimeType(mimeType);
    console.log('Initialized audio MIME type:', mimeType, 'iOS:', isIOS());
  }, []);

  // 为每个段落维护独立的录音状态
  const [segmentStates, setSegmentStates] = useState<Map<number, SegmentRecordingState>>(
    new Map(userSegments.map((_, idx) => [
      idx,
      {
        isRecording: false,
        recordedAudio: null,
        recordedAudioUrl: null,
        recordingTime: 0,
        currentBackingTime: 0,
      }
    ]))
  );

  const mediaRecorderRefs = useRef<Map<number, MediaRecorder>>(new Map());
  const audioChunksRefs = useRef<Map<number, Blob[]>>(new Map());
  const backingAudioRef = useRef<HTMLAudioElement | null>(null);
  const recordingIntervalRefs = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const playingAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // 获取已有的录音
  useEffect(() => {
    fetchRecordings();
    const interval = setInterval(fetchRecordings, 2000);
    return () => clearInterval(interval);
  }, []);

  // 设置伴奏音量
  useEffect(() => {
    if (backingAudioRef.current) {
      backingAudioRef.current.volume = 0.3;
    }
  }, []);

  // 更新播放进度
  useEffect(() => {
    if (playingRecordingId) {
      const recording = recordings.find((r) => r.id === playingRecordingId);
      if (!recording) return;

      const updateTimer = setInterval(() => {
        const audio = playingAudioRefs.current.get(playingRecordingId);
        if (audio && !audio.paused) {
          const actualDuration = audio.duration;
          const maxDuration = recording.endTime - recording.startTime;
          const stopTime = Math.min(actualDuration, maxDuration);

          if (audio.currentTime >= stopTime - 0.1) {
            audio.pause();
            audio.currentTime = 0;
            setPlayingRecordingId(null);
            return;
          }

          setRecordingPlaybackTimes(prev => new Map(prev).set(playingRecordingId, audio.currentTime));
        }
      }, 30);

      return () => clearInterval(updateTimer);
    }
  }, [playingRecordingId, recordings]);

  // 更新伴奏播放进度
  useEffect(() => {
    if (playingWithBackingId) {
      const recording = recordings.find((r) => r.id === playingWithBackingId);
      if (!recording || !backingAudioRef.current) return;

      const updateTimer = setInterval(() => {
        const audio = playingAudioRefs.current.get(playingWithBackingId);
        const backing = backingAudioRef.current;

        if (audio && backing && !audio.paused && !backing.paused) {
          const maxDuration = recording.endTime - recording.startTime;

          // 检查是否播放完成
          if (audio.currentTime >= maxDuration - 0.1 || backing.currentTime >= recording.endTime) {
            audio.pause();
            backing.pause();
            setPlayingWithBackingId(null);
            return;
          }

          setBackingPlaybackTime(backing.currentTime);
        }
      }, 30);

      return () => clearInterval(updateTimer);
    }
  }, [playingWithBackingId, recordings]);

  const fetchRecordings = async () => {
    try {
      const response = await fetch(`/api/chain-recordings?songId=${song.id}&t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        setRecordings(data);
      }
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
    }
  };

  const startRecording = async (segmentIndex: number) => {
    try {
      const segment = userSegments[segmentIndex];
      if (!segment) return;

      const timeRange = getTimeRangeByLineIds(segment.startLineId, segment.endLineId);
      const { startTime, endTime } = timeRange;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 使用最佳的 MIME 类型创建 MediaRecorder
      const options: MediaRecorderOptions = {};
      if (audioMimeType && MediaRecorder.isTypeSupported(audioMimeType)) {
        options.mimeType = audioMimeType;
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRefs.current.set(segmentIndex, mediaRecorder);
      audioChunksRefs.current.set(segmentIndex, []);

      mediaRecorder.ondataavailable = (event) => {
        const chunks = audioChunksRefs.current.get(segmentIndex) || [];
        chunks.push(event.data);
        audioChunksRefs.current.set(segmentIndex, chunks);
      };

      mediaRecorder.onstop = async () => {
        const chunks = audioChunksRefs.current.get(segmentIndex) || [];
        let audioBlob = new Blob(chunks, { type: audioMimeType });
        
        // iOS 上如果是 WebM，尝试转换为 WAV
        if (isIOS() && audioMimeType.includes('webm')) {
          try {
            audioBlob = await convertBlobToWav(audioBlob);
          } catch (error) {
            console.error('Failed to convert to WAV, using original blob:', error);
          }
        }
        
        const url = URL.createObjectURL(audioBlob);

        setSegmentStates(prev => {
          const newMap = new Map(prev);
          const state = newMap.get(segmentIndex) || { isRecording: false, recordedAudio: null, recordedAudioUrl: null, recordingTime: 0, currentBackingTime: 0 };
          newMap.set(segmentIndex, {
            ...state,
            recordedAudio: audioBlob,
            recordedAudioUrl: url,
          });
          return newMap;
        });

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();

      setSegmentStates(prev => {
        const newMap = new Map(prev);
        const state = newMap.get(segmentIndex) || { isRecording: false, recordedAudio: null, recordedAudioUrl: null, recordingTime: 0, currentBackingTime: 0 };
        newMap.set(segmentIndex, { ...state, isRecording: true });
        return newMap;
      });

      // 播放伴奏
      if (backingAudioRef.current) {
        backingAudioRef.current.currentTime = startTime;
        backingAudioRef.current.play().catch((error) => {
          console.error('Failed to play backing track:', error);
        });
      }

      // 录音计时
      const updateTimer = setInterval(() => {
        const currentTime = backingAudioRef.current?.currentTime || 0;

        if (currentTime >= endTime) {
          stopRecording(segmentIndex);
        } else {
          setSegmentStates(prev => {
            const newMap = new Map(prev);
            const state = newMap.get(segmentIndex) || { isRecording: false, recordedAudio: null, recordedAudioUrl: null, recordingTime: 0, currentBackingTime: 0 };
            newMap.set(segmentIndex, {
              ...state,
              recordingTime: Math.floor((currentTime - startTime) * 10) / 10,
              currentBackingTime: currentTime,
            });
            return newMap;
          });
        }
      }, 50);

      recordingIntervalRefs.current.set(segmentIndex, updateTimer);
      toast.success(`开始录制第 ${segmentIndex + 1} 部分`);
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('无法访问麦克风');
    }
  };

  const stopRecording = (segmentIndex: number) => {
    const mediaRecorder = mediaRecorderRefs.current.get(segmentIndex);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();

      setSegmentStates(prev => {
        const newMap = new Map(prev);
        const state = newMap.get(segmentIndex) || { isRecording: false, recordedAudio: null, recordedAudioUrl: null, recordingTime: 0, currentBackingTime: 0 };
        newMap.set(segmentIndex, { ...state, isRecording: false });
        return newMap;
      });

      if (backingAudioRef.current) {
        backingAudioRef.current.pause();
      }

      const timer = recordingIntervalRefs.current.get(segmentIndex);
      if (timer) {
        clearInterval(timer);
        recordingIntervalRefs.current.delete(segmentIndex);
      }

      toast.success('录音已停止');
    }
  };

  const uploadRecording = async (segmentIndex: number) => {
    const state = segmentStates.get(segmentIndex);
    if (!state?.recordedAudio) {
      toast.error('请先录音');
      return;
    }

    const segment = userSegments[segmentIndex];
    if (!segment) return;

    const timeRange = getTimeRangeByLineIds(segment.startLineId, segment.endLineId);
    const { startTime, endTime } = timeRange;

    setIsUploading(true);
    try {
      const formData = new FormData();
      const fileExtension = getFileExtension(audioMimeType);
      formData.append('file', state.recordedAudio, `recording.${fileExtension}`);
      formData.append('songId', song.id);
      formData.append('userId', userId);
      formData.append('startTime', String(startTime));
      formData.append('endTime', String(endTime));

      const response = await fetch('/api/chain-recordings', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success(`第 ${segmentIndex + 1} 部分已上传`);

        setSegmentStates(prev => {
          const newMap = new Map(prev);
          newMap.set(segmentIndex, {
            isRecording: false,
            recordedAudio: null,
            recordedAudioUrl: null,
            recordingTime: 0,
            currentBackingTime: 0,
          });
          return newMap;
        });

        audioChunksRefs.current.delete(segmentIndex);
        setRerecordingSegments(prev => {
          const newSet = new Set(prev);
          newSet.delete(segmentIndex);
          return newSet;
        });
        fetchRecordings();
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

  const togglePlayRecording = (recordingId: string) => {
    const audio = playingAudioRefs.current.get(recordingId);
    if (!audio) return;

    const recording = recordings.find((r) => r.id === recordingId);
    if (!recording) return;

    if (playingRecordingId === recordingId) {
      audio.pause();
      setPlayingRecordingId(null);
    } else {
      // 停止其他单独播放
      playingAudioRefs.current.forEach((a, id) => {
        if (id !== recordingId) {
          a.pause();
        }
      });

      // 停止伴奏播放
      if (backingAudioRef.current) {
        backingAudioRef.current.pause();
      }
      setPlayingWithBackingId(null);

      audio.currentTime = 0;
      audio.play().catch((error) => {
        console.error('Failed to play recording:', error);
      });

      setPlayingRecordingId(recordingId);
    }
  };

  const togglePlayWithBacking = (recordingId: string) => {
    const recording = recordings.find((r) => r.id === recordingId);
    if (!recording || !backingAudioRef.current) return;

    if (playingWithBackingId === recordingId) {
      backingAudioRef.current.pause();
      const audio = playingAudioRefs.current.get(recordingId);
      if (audio) audio.pause();
      setPlayingWithBackingId(null);
    } else {
      // 停止所有单独播放
      playingAudioRefs.current.forEach((a) => a.pause());
      setPlayingRecordingId(null);

      // 停止其他伴奏播放
      if (backingAudioRef.current) {
        backingAudioRef.current.pause();
      }

      // 开始播放
      const audio = playingAudioRefs.current.get(recordingId);
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch((error) => {
          console.error('Failed to play recording:', error);
        });
      }

      backingAudioRef.current.currentTime = recording.startTime;
      backingAudioRef.current.play().catch((error) => {
        console.error('Failed to play backing track:', error);
      });

      setPlayingWithBackingId(recordingId);
    }
  };

  const discardRecording = (segmentIndex: number) => {
    setSegmentStates(prev => {
      const newMap = new Map(prev);
      newMap.set(segmentIndex, {
        isRecording: false,
        recordedAudio: null,
        recordedAudioUrl: null,
        recordingTime: 0,
        currentBackingTime: 0,
      });
      return newMap;
    });
    audioChunksRefs.current.delete(segmentIndex);
    toast.info(`已丢弃第 ${segmentIndex + 1} 部分的录音`);
  };

  return (
    <div className="space-y-6">
      {/* 隐藏的音频元素 */}
      <audio ref={backingAudioRef} src={song.backingTrackUrl} />

      {/* 总体进度 */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">接龙进度</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">已录音人数</p>
              <p className="text-3xl font-bold text-purple-400">{recordings.length}</p>
              {recordings.length > 0 && (
                <div className="mt-2 space-y-1">
                  {Array.from(new Set(recordings.map(r => r.userId))).map((uid) => (
                    <p key={uid} className="text-xs text-gray-300">
                      • {uid}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-slate-900/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">你的部分</p>
              <div className="space-y-1">
                {userSegments.map((_, idx) => {
                  const userRecorded = recordings.some(r => r.userId === userId && r.startTime === getTimeRangeByLineIds(userSegments[idx].startLineId, userSegments[idx].endLineId).startTime);
                  return (
                    <p key={idx} className={`text-sm font-semibold ${userRecorded ? 'text-green-400' : 'text-gray-300'}`}>
                      {userRecorded ? '✓' : '○'} 第 {idx + 1} 部分
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 每个部分的录音卡片 */}
      {userSegments.map((segment, segmentIndex) => {
        const timeRange = getTimeRangeByLineIds(segment.startLineId, segment.endLineId);
        const { startTime, endTime } = timeRange;
        const state = segmentStates.get(segmentIndex);
        const segmentRecordings = recordings.filter(r =>
          r.startTime === startTime && r.endTime === endTime
        );
        const userRecorded = segmentRecordings.some(r => r.userId === userId);
        const isRerecording = rerecordingSegments.has(segmentIndex);

        return (
          <div key={segmentIndex} className="space-y-4">
            {/* 录音控制卡片 - 未录制或正在重新录制时显示 */}
            {(!userRecorded || isRerecording) && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <span className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      {segmentIndex + 1}
                    </span>
                    第 {segmentIndex + 1} 部分
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 歌词显示 */}
                  <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm mb-3">你要唱的歌词</p>
                    <div className="space-y-1">
                      {getLyricsByRange(segment.startLineId, segment.endLineId).map((lyric) => (
                        <div key={lyric.id} className="flex gap-2 text-sm">
                          <span className="text-purple-400 font-semibold flex-shrink-0 w-5">{lyric.id}.</span>
                          <div className="flex-1">
                            <p className="text-white">{lyric.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 录音控制 */}
                  {!state?.recordedAudio ? (
                    <>
                      {/* 卡拉OK显示 */}
                      {state?.isRecording && (
                        <KaraokeDisplay
                          currentTime={state.currentBackingTime}
                          isPlaying={state.isRecording}
                          userStartLineId={segment.startLineId}
                          userEndLineId={segment.endLineId}
                        />
                      )}

                      {/* 进度条 */}
                      {state?.isRecording && (
                        <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-red-600 h-full transition-all duration-100"
                            style={{ width: `${(state.recordingTime / (endTime - startTime)) * 100}%` }}
                          />
                        </div>
                      )}

                      {/* 时间显示 */}
                      {state?.isRecording && (
                        <div className="text-center text-sm text-gray-400">
                          {state.recordingTime.toFixed(1)}s / {(endTime - startTime).toFixed(0)}s
                        </div>
                      )}

                      {/* 录音按钮 */}
                      <div className="flex gap-2">
                        {!state?.isRecording ? (
                          <Button
                            onClick={() => startRecording(segmentIndex)}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
                          >
                            <Mic className="w-4 h-4" />
                            开始录音
                          </Button>
                        ) : (
                          <Button
                            onClick={() => stopRecording(segmentIndex)}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
                          >
                            <Square className="w-4 h-4" />
                            停止录音
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* 已录音显示 */}
                      <div className="bg-green-900/30 border border-green-500/50 p-3 rounded-lg">
                        <p className="text-green-400 font-semibold text-sm mb-2">✓ 已录音</p>
                        <audio
                          src={state.recordedAudioUrl || ''}
                          controls
                          className="w-full"
                        />
                      </div>

                      {/* 上传/丢弃按钮 */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => uploadRecording(segmentIndex)}
                          disabled={isUploading}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <Upload className="w-4 h-4" />
                          {isUploading ? '上传中...' : '上传'}
                        </Button>
                        <Button
                          onClick={() => discardRecording(segmentIndex)}
                          disabled={isUploading}
                          variant="outline"
                          className="flex-1 flex items-center justify-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          重新录制
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 已录制时显示 - 只显示简单标题卡片（非重新录制状态） */}
            {userRecorded && !isRerecording && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        {segmentIndex + 1}
                      </span>
                      第 {segmentIndex + 1} 部分
                    </span>
                    <span className="text-green-400 text-sm font-normal">✓ 已录制</span>
                  </CardTitle>
                </CardHeader>
              </Card>
            )}

            {/* 该部分的已录音列表 */}
            {segmentRecordings.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">第 {segmentIndex + 1} 部分的录音</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {segmentRecordings.map((recording, index) => {
                      const currentTime = recordingPlaybackTimes.get(recording.id) || 0;
                      const maxDuration = recording.endTime - recording.startTime;
                      const actualDuration = recordingDurations.get(recording.id) || maxDuration;
                      const displayDuration = Math.min(actualDuration, maxDuration);
                      const progress = (currentTime / displayDuration) * 100;

                      return (
                        <div
                          key={recording.id}
                          className="bg-slate-900/50 p-3 rounded-lg space-y-2"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold">{recording.userId}</p>
                              <p className="text-gray-400 text-sm">
                                {recording.startTime.toFixed(0)}-{recording.endTime.toFixed(0)}s
                              </p>
                            </div>
                            <audio
                              ref={(el) => {
                                if (el) {
                                  playingAudioRefs.current.set(recording.id, el);
                                }
                              }}
                              src={recording.audioUrl}
                              onEnded={() => setPlayingRecordingId(null)}
                              onLoadedMetadata={(e) => {
                                const audio = e.currentTarget;
                                if (audio.duration && audio.duration > 0) {
                                  setRecordingDurations(prev => new Map(prev).set(recording.id, audio.duration));
                                }
                              }}
                            />
                            <Button
                              onClick={() => togglePlayWithBacking(recording.id)}
                              size="sm"
                              variant="outline"
                              className="flex-shrink-0"
                            >
                              {playingWithBackingId === recording.id ? '停止' : '带伴奏播放 (很可能不同步)'}
                            </Button>
                            <Button
                              onClick={() => togglePlayRecording(recording.id)}
                              size="sm"
                              variant="outline"
                              className="flex-shrink-0"
                            >
                              {playingRecordingId === recording.id ? '暂停' : '播放'}
                            </Button>
                            {recording.userId === userId && (
                              <Button
                                onClick={() => {
                                  setSegmentStates(prev => {
                                    const newMap = new Map(prev);
                                    newMap.set(segmentIndex, {
                                      isRecording: false,
                                      recordedAudio: null,
                                      recordedAudioUrl: null,
                                      recordingTime: 0,
                                      currentBackingTime: 0,
                                    });
                                    return newMap;
                                  });
                                  audioChunksRefs.current.delete(segmentIndex);
                                  setRerecordingSegments(prev => new Set(prev).add(segmentIndex));
                                  toast.info(`开始重新录制第 ${segmentIndex + 1} 部分`);
                                }}
                                size="sm"
                                className="flex-shrink-0 bg-orange-600 hover:bg-orange-700"
                              >
                                重录
                              </Button>
                            )}
                          </div>
                          {playingRecordingId === recording.id && (
                            <div className="space-y-1">
                              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-purple-600 h-full transition-all duration-100"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-xs text-gray-400">
                                <span>{currentTime.toFixed(1)}s</span>
                                <span>{displayDuration.toFixed(0)}s</span>
                              </div>
                            </div>
                          )}
                          {playingWithBackingId === recording.id && (
                            <div className="space-y-1">
                              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-green-600 h-full transition-all duration-100"
                                  style={{ width: `${((backingPlaybackTime - recording.startTime) / (recording.endTime - recording.startTime)) * 100}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-xs text-gray-400">
                                <span>{(backingPlaybackTime - recording.startTime).toFixed(1)}s</span>
                                <span>{(recording.endTime - recording.startTime).toFixed(0)}s</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      })}
    </div>
  );
}
