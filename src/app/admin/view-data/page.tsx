'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Play, Pause, Users, Clock } from 'lucide-react';

interface Recording {
  id: string;
  songId: string;
  userId: string;
  startTime: number;
  endTime: number;
  audioUrl: string;
  createdAt: string;
}

export default function ViewDataPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<Map<string, HTMLAudioElement>>(new Map());

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/chain-recordings');
      if (response.ok) {
        const data = await response.json();
        setRecordings(data);
      }
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  const togglePlay = (recording: Recording) => {
    const audio = audioElements.get(recording.id);
    
    if (playingId === recording.id) {
      // 暂停当前播放
      audio?.pause();
      setPlayingId(null);
    } else {
      // 停止其他音频
      audioElements.forEach((audio, id) => {
        if (id !== recording.id) {
          audio.pause();
        }
      });
      
      // 播放选中的音频
      if (audio) {
        audio.play();
        setPlayingId(recording.id);
      }
    }
  };

  const createAudioElement = (recording: Recording) => {
    if (!audioElements.has(recording.id)) {
      const audio = new Audio(recording.audioUrl);
      audio.onended = () => setPlayingId(null);
      setAudioElements(prev => new Map(prev).set(recording.id, audio));
    }
  };

  // 统计数据
  const uniqueUsers = Array.from(new Set(recordings.map(r => r.userId)));
  const totalDuration = recordings.reduce((sum, r) => sum + (r.endTime - r.startTime), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">录音数据管理</h1>
          <Button onClick={fetchRecordings} disabled={loading} className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新数据
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                总录音数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-400">{recordings.length}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                参与用户数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-400">{uniqueUsers.length}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                总时长
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-400">{totalDuration.toFixed(1)}s</p>
            </CardContent>
          </Card>
        </div>

        {/* 用户列表 */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">参与用户</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {uniqueUsers.map(userId => {
                const userRecordings = recordings.filter(r => r.userId === userId);
                return (
                  <div key={userId} className="bg-slate-900/50 px-3 py-1 rounded-full">
                    <span className="text-white font-medium">{userId}</span>
                    <span className="text-gray-400 ml-2">({userRecordings.length}个录音)</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 录音列表 */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">所有录音</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                <p className="text-gray-400 mt-2">加载中...</p>
              </div>
            ) : recordings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">暂无录音数据</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recordings.map((recording) => {
                  createAudioElement(recording);
                  return (
                    <div
                      key={recording.id}
                      className="bg-slate-900/50 p-4 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div className="bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold">
                            {recording.userId.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-semibold">{recording.userId}</p>
                            <p className="text-gray-400 text-sm">
                              {recording.startTime.toFixed(1)}s - {recording.endTime.toFixed(1)}s
                              <span className="ml-2">
                                ({new Date(recording.createdAt).toLocaleString()})
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => togglePlay(recording)}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          {playingId === recording.id ? (
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
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}