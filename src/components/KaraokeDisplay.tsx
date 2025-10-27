'use client';

import { useEffect, useState } from 'react';
import { MONDAY_LYRICS, getCurrentLyric, getNextLyric, LyricLine } from '@/lib/lyrics';

interface KaraokeDisplayProps {
  currentTime: number;
  isPlaying: boolean;
  userStartLineId: number;
  userEndLineId: number;
}

export default function KaraokeDisplay({
  currentTime,
  isPlaying,
  userStartLineId,
  userEndLineId,
}: KaraokeDisplayProps) {
  const [currentLyric, setCurrentLyric] = useState<LyricLine | null>(null);
  const [nextLyric, setNextLyric] = useState<LyricLine | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const current = getCurrentLyric(currentTime);
    let next = getNextLyric(currentTime);
    
    // 只显示用户范围内的歌词
    const isCurrentInRange = current && 
      current.id >= userStartLineId && 
      current.id <= userEndLineId;
    
    const isNextInRange = next && 
      next.id >= userStartLineId && 
      next.id <= userEndLineId;
    
    setCurrentLyric(isCurrentInRange ? current : null);
    setNextLyric(isNextInRange ? next : null);

    // 计算当前歌词的进度（0-100%）
    if (current && next && isCurrentInRange) {
      const duration = next.time - current.time;
      const elapsed = currentTime - current.time;
      setProgress(Math.min(100, (elapsed / duration) * 100));
    } else if (current && isCurrentInRange) {
      setProgress(100);
    } else {
      setProgress(0);
    }
  }, [currentTime, userStartLineId, userEndLineId]);

  return (
    <div className="w-full bg-gradient-to-b from-purple-900/50 to-transparent rounded-lg p-6 min-h-32 flex flex-col justify-center items-center">
      {isPlaying ? (
        <div className="w-full space-y-4">
          {/* 当前歌词 */}
          <div className="relative">
            <div className="text-center">
              <p className="text-3xl font-bold transition-all duration-300 text-yellow-300 drop-shadow-lg">
                {currentLyric?.text || '准备开始...'}
              </p>
            </div>

            {/* 进度条蒙层 */}
            {currentLyric && (
              <div className="mt-4 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-300 transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>

          {/* 下一句歌词预览 */}
          {nextLyric && (
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">下一句</p>
              <p className="text-lg text-gray-500">{nextLyric.text}</p>
            </div>
          )}

          {/* 用户范围提示 */}
          <div className="text-center text-xs text-gray-400 mt-4">
            <p>你的部分: 第 {userStartLineId} - {userEndLineId} 句</p>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400">
          <p className="text-lg">点击播放开始唱歌</p>
          <p className="text-sm mt-2">你的部分: 第 {userStartLineId} - {userEndLineId} 句</p>
        </div>
      )}
    </div>
  );
}
