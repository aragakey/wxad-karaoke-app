"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause } from "lucide-react"
import { MONDAY_LYRICS, USER_ASSIGNMENTS, getCurrentLyric } from "@/lib/lyrics"

interface CircleKaraokeProps {
  originalUrl: string
}

// 添加旋转动画样式
const spinKeyframes = `
  @keyframes spin-slow {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`

export default function CircleKaraoke({ originalUrl }: CircleKaraokeProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [hasUserSeeked, setHasUserSeeked] = useState(false) // 记录用户是否手动拖动过进度条
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const DEFAULT_START_TIME = 0 // 默认开始时间（秒）
  const AUDIO_TIME_OFFSET = 42 // 最终合成版音频剪掉的前奏时长（秒）

  // 获取当前应该显示的歌词和高亮的用户（可能有多个用户唱同一句）
  const getCurrentSingers = (time: number): string[] => {
    // 将音频时间转换为歌词时间（加上偏移量）
    const lyricsTime = time + AUDIO_TIME_OFFSET
    const currentLyric = getCurrentLyric(lyricsTime)
    if (!currentLyric) return []

    const singers: string[] = []
    // 找到唱这句歌词的所有用户
    for (const user of USER_ASSIGNMENTS) {
      for (const segment of user.segments) {
        if (
          currentLyric.id >= segment.startLineId &&
          currentLyric.id <= segment.endLineId
        ) {
          singers.push(user.userId)
          break // 每个用户只添加一次
        }
      }
    }
    return singers
  }

  const currentSingers = getCurrentSingers(currentTime)
  // 显示歌词时也要加上偏移量
  const currentLyric = getCurrentLyric(currentTime + AUDIO_TIME_OFFSET)

  const postMessageToParent = (type: string, payload: Record<string, unknown>) => {
    if (window.parent !== window) {
      window.parent.postMessage({ source: "karaoke", type, ...payload }, "*")
    }
  }

  // 向父窗口广播当前播放状态
  const lastBroadcastRef = useRef<string>("")
  useEffect(() => {
    const singers = currentSingers.map((id) => {
      const user = USER_ASSIGNMENTS.find((u) => u.userId === id)
      return user ? { userId: user.userId, nickname: user.nickname, avatar: user.avatar } : { userId: id, nickname: id, avatar: "" }
    })

    const payload = {
      currentTime,
      duration,
      isPlaying,
      lyric: currentLyric ? { id: currentLyric.id, time: currentLyric.time, text: currentLyric.text } : null,
      singers,
      progress: duration > 0 ? currentTime / duration : 0,
    }

    const key = `${currentLyric?.id}-${Math.floor(currentTime * 2)}`
    if (key !== lastBroadcastRef.current) {
      lastBroadcastRef.current = key
      postMessageToParent("timeupdate", payload)
    }
  }, [currentTime, currentLyric, currentSingers, duration, isPlaying])

  // 接收父窗口的控制指令
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data || e.data.source !== "karaoke-host") return
      const audio = audioRef.current
      if (!audio) return

      switch (e.data.type) {
        case "play":
          if (!hasUserSeeked && audio.currentTime < 1) {
            audio.currentTime = DEFAULT_START_TIME
          }
          audio.play()
          setIsPlaying(true)
          break
        case "pause":
          audio.pause()
          setIsPlaying(false)
          break
        case "seek":
          if (typeof e.data.time === "number") {
            audio.currentTime = e.data.time
            setCurrentTime(e.data.time)
            setHasUserSeeked(true)
          }
          break
        case "toggle":
          if (isPlaying) {
            audio.pause()
            setIsPlaying(false)
          } else {
            if (!hasUserSeeked && audio.currentTime < 1) {
              audio.currentTime = DEFAULT_START_TIME
            }
            audio.play()
            setIsPlaying(true)
          }
          break
      }
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [isPlaying, hasUserSeeked])

  // 初始化音频
  useEffect(() => {
    const audio = new Audio(originalUrl)
    audio.volume = 0.8
    audioRef.current = audio

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration)
    })

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime)
    })

    audio.addEventListener("ended", () => {
      setIsPlaying(false)
      setCurrentTime(0)
      audio.currentTime = 0
      postMessageToParent("ended", {})
    })

    audio.addEventListener("loadedmetadata", () => {
      postMessageToParent("ready", { duration: audio.duration })
    })

    return () => {
      audio.pause()
      audio.src = ""
    }
  }, [originalUrl])

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      postMessageToParent("pause", { currentTime })
    } else {
      if (!hasUserSeeked && audioRef.current.currentTime < 1) {
        audioRef.current.currentTime = DEFAULT_START_TIME
      }
      audioRef.current.play()
      postMessageToParent("play", { currentTime })
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return
    const newTime = value[0]
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
    setHasUserSeeked(true) // 标记用户已手动拖动过
  }

  // 点击头像跳转到对应用户的部分
  const handleAvatarClick = (userId: string) => {
    if (!audioRef.current) return
    
    const user = USER_ASSIGNMENTS.find(u => u.userId === userId)
    if (!user || user.segments.length === 0) return
    
    // 找到该用户第一个段落的第一句歌词
    const firstSegment = user.segments[0]
    const firstLyric = MONDAY_LYRICS.find(lyric => lyric.id === firstSegment.startLineId)
    
    if (!firstLyric) return
    
    // 跳转到该歌词的准确时间（减去偏移量，因为音频剪掉了前奏）
    const audioTime = firstLyric.time - AUDIO_TIME_OFFSET
    audioRef.current.currentTime = audioTime
    setCurrentTime(audioTime)
    setHasUserSeeked(true)
    
    // 如果没有在播放，则开始播放
    if (!isPlaying) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  // 判断是否为合唱部分（多个人同时唱）
  const isChorusPart = currentSingers.length > 1

  // 计算用户在圆上的位置（固定位置，旋转通过 CSS 实现）
  const getUserPosition = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2 // 从顶部开始
    const radius = 45 // 半径百分比
    const x = 50 + radius * Math.cos(angle)
    const y = 50 + radius * Math.sin(angle)
    return { x, y }
  }

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // 获取要显示的歌词（当前句和前后各一句）
  const getDisplayLyrics = () => {
    if (!currentLyric) return []
    
    const currentIndex = MONDAY_LYRICS.findIndex(l => l.id === currentLyric.id)
    const result = []
    
    // 前一句
    if (currentIndex > 0) {
      result.push({ ...MONDAY_LYRICS[currentIndex - 1], isCurrent: false, isPast: true })
    }
    
    // 当前句
    result.push({ ...currentLyric, isCurrent: true, isPast: false })
    
    // 后一句
    if (currentIndex < MONDAY_LYRICS.length - 1) {
      result.push({ ...MONDAY_LYRICS[currentIndex + 1], isCurrent: false, isPast: false })
    }
    
    return result
  }

  return (
    <>
      {/* 注入自定义动画样式 */}
      <style dangerouslySetInnerHTML={{ __html: spinKeyframes }} />
      
      <Card className="bg-stone-900/80 border-stone-800">
      <CardHeader>
        <CardTitle className="text-sm text-stone-200 flex items-center justify-between gap-2">
          <span>合唱（头像可点）</span>
          {isChorusPart && (
            <span className="text-violet-400 animate-pulse">
              合唱中
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 圆形排列的用户头像 */}
        <div className="relative w-full aspect-square max-w-2xl mx-auto">
          {/* 中心歌词显示区域 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`w-3/5 h-3/5 bg-stone-900 rounded-full border-2 flex flex-col items-center justify-center p-6 overflow-visible transition-all duration-500 ${
              isChorusPart 
                ? "border-violet-400/40 shadow-lg shadow-violet-500/15" 
                : "border-stone-700"
            }`}>
              <div className="text-center space-y-2 max-w-full">
                {getDisplayLyrics().map((lyric) => (
                  <p
                    key={lyric.id}
                    className={`transition-all duration-300 whitespace-normal break-words px-2 ${
                      lyric.isCurrent
                        ? "text-stone-100 text-lg md:text-xl font-bold"
                        : lyric.isPast
                        ? "text-stone-600 text-xs md:text-sm"
                        : "text-stone-400 text-sm md:text-base"
                    }`}
                  >
                    {lyric.text}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* 旋转容器 - 只在合唱时旋转 */}
          <div 
            className="absolute inset-0"
            style={{
              animation: isChorusPart ? "spin-slow 30s linear infinite" : "none",
              transition: "none",
            }}
          >
            {/* 用户头像圆形排列 */}
            {USER_ASSIGNMENTS.map((user, index) => {
              const { x, y } = getUserPosition(index, USER_ASSIGNMENTS.length)
              const isActive = currentSingers.includes(user.userId)

              return (
                <div
                  key={user.userId}
                  className="absolute"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {/* 反向旋转容器 - 抵消父容器的旋转 */}
                  <div
                    style={{
                      animation: isChorusPart ? "spin-slow 30s linear infinite reverse" : "none",
                      transition: "none",
                    }}
                  >
                    <div
                      className={`relative transition-all duration-300 cursor-pointer ${
                        isActive
                          ? "scale-110 z-10"
                          : "scale-100 hover:scale-105"
                      }`}
                      onClick={() => handleAvatarClick(user.userId)}
                      title={`跳转到 ${user.nickname} 的部分`}
                    >
                      {/* 头像 */}
                      <div
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 ${
                          isActive
                            ? "ring-3 ring-violet-400 shadow-lg shadow-violet-500/25"
                            : "ring-1 ring-stone-600 hover:ring-2 hover:ring-violet-300"
                        }`}
                      >
                        <img
                          src={user.avatar}
                          alt={user.nickname}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // 如果图片加载失败，显示文字
                            e.currentTarget.style.display = 'none'
                            const parent = e.currentTarget.parentElement
                            if (parent) {
                              parent.classList.add('bg-stone-700')
                              parent.innerHTML = `<span class="text-white font-bold text-sm md:text-base">${user.nickname.slice(0, 2).toUpperCase()}</span>`
                            }
                          }}
                        />
                      </div>

                      {/* 脉冲动画 - 只在当前唱歌的人显示 */}
                      {isActive && (
                        <>
                          <div className="absolute inset-0 rounded-full bg-violet-500/25 animate-ping"></div>
                          <div className="absolute inset-0 rounded-full bg-violet-500/15 animate-pulse"></div>
                        </>
                      )}

                      {/* 用户昵称 */}
                      <div
                        className={`absolute top-full mt-1 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-[10px] md:text-xs transition-all duration-300 ${
                          isActive
                            ? "text-violet-300 font-bold"
                            : "text-stone-500"
                        }`}
                      >
                        {user.nickname}
                      </div>
                    </div>
                  </div>
                </div>
              )
          })}
          </div>
        </div>

        {/* 播放控制 */}
        <div className="mt-16 space-y-2">
          {/* 进度条 */}
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-stone-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* 播放按钮 */}
          <div className="flex justify-center">
            <Button
              onClick={togglePlay}
              size="lg"
              className="w-24 h-24 rounded-full bg-violet-500 hover:bg-violet-400 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-10 h-10" />
              ) : (
                <Play className="w-10 h-10" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    </>
  )
}
