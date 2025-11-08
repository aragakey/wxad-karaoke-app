"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mic, Square, Upload, RotateCcw, Headphones } from "lucide-react"
import { toast } from "sonner"
import KaraokeDisplay from "./KaraokeDisplay"
import {
  getUserLyricSegments,
  getTimeRangeByLineIds,
  getLyricsByRange,
  commonSegments,
} from "@/lib/lyrics"
import {
  getBestAudioMimeType,
  getFileExtension,
  convertBlobToWav,
  isIOS,
} from "@/lib/audioConverter"

interface Recording {
  id: string
  userId: string
  audioUrl: string
  startTime: number
  endTime: number
  startLineId?: number
  endLineId?: number
  createdAt: string
}

interface ChainRecorderProps {
  song: {
    id: string
    title: string
    artist: string
    backingTrackUrl: string
    originalUrl?: string
  }
  userId: string
}

interface SegmentRecordingState {
  isRecording: boolean
  recordedAudio: Blob | null
  recordedAudioUrl: string | null
  recordingTime: number
  currentBackingTime: number
}

export default function ChainRecorder({ song, userId }: ChainRecorderProps) {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(
    null
  )
  const [recordingPlaybackTimes, setRecordingPlaybackTimes] = useState<
    Map<string, number>
  >(new Map())
  const [recordingDurations, setRecordingDurations] = useState<
    Map<string, number>
  >(new Map())
  const [rerecordingSegments, setRerecordingSegments] = useState<Set<number>>(
    new Set()
  )
  const [playingWithBackingId, setPlayingWithBackingId] = useState<
    string | null
  >(null)
  const [backingPlaybackTime, setBackingPlaybackTime] = useState(0)
  const [audioMimeType, setAudioMimeType] = useState<string>("audio/webm")
  const [isPlayingOriginal, setIsPlayingOriginal] = useState<
    Map<number, boolean>
  >(new Map())
  const [originalPlaybackTime, setOriginalPlaybackTime] = useState<
    Map<number, number>
  >(new Map())
  const [isAudioLoaded, setIsAudioLoaded] = useState(false)
  const isAudioLoadedRef = useRef(false)

  // 获取用户的歌词段落
  const userSegments = getUserLyricSegments(userId)

  // 初始化时获取最佳的音频 MIME 类型
  useEffect(() => {
    const mimeType = getBestAudioMimeType()
    setAudioMimeType(mimeType)
    console.log("Initialized audio MIME type:", mimeType, "iOS:", isIOS())
  }, [])

  // 为每个段落维护独立的录音状态
  const [segmentStates, setSegmentStates] = useState<
    Map<number, SegmentRecordingState>
  >(
    new Map(
      userSegments.map((_, idx) => [
        idx,
        {
          isRecording: false,
          recordedAudio: null,
          recordedAudioUrl: null,
          recordingTime: 0,
          currentBackingTime: 0,
        },
      ])
    )
  )

  const mediaRecorderRefs = useRef<Map<number, MediaRecorder>>(new Map())
  const audioChunksRefs = useRef<Map<number, Blob[]>>(new Map())
  const backingAudioRef = useRef<HTMLAudioElement | null>(null)
  const originalAudioRefs = useRef<Map<number, HTMLAudioElement>>(new Map())
  const recordingIntervalRefs = useRef<Map<number, NodeJS.Timeout>>(new Map())
  const playingAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map())
  const originalPlaybackIntervalRefs = useRef<Map<number, NodeJS.Timeout>>(
    new Map()
  )

  // 获取已有的录音
  useEffect(() => {
    fetchRecordings()
    const interval = setInterval(fetchRecordings, 2000)
    return () => clearInterval(interval)
  }, [])

  // 设置伴奏音量和预加载音频
  useEffect(() => {
    // 重置加载状态
    setIsAudioLoaded(false)
    isAudioLoadedRef.current = false

    const cleanupFunctions: (() => void)[] = []

    // 使用 setTimeout 确保 DOM 已经渲染
    const initTimer = setTimeout(() => {
      const audio = backingAudioRef.current
      if (!audio) {
        console.error("音频元素未找到，无法加载音频")
        return
      }

      console.log("开始初始化音频，readyState:", audio.readyState)

      audio.volume = 0.3

      // 计算用户所有段落的最大 endTime，确保预加载到足够的位置
      let maxEndTime = 0
      userSegments.forEach((segment) => {
        const timeRange = getTimeRangeByLineIds(
          segment.startLineId,
          segment.endLineId
        )
        if (timeRange.endTime > maxEndTime) {
          maxEndTime = timeRange.endTime
        }
      })

      // 定义事件处理函数
      const handleError = (e: Event) => {
        console.error("音频加载失败", e)
        // 加载失败时也显示页面，让用户知道有问题
        setIsAudioLoaded(true)
        isAudioLoadedRef.current = true
      }

      // 等待元数据加载后，预加载到最大位置
      const preloadAudio = () => {
        const currentAudio = backingAudioRef.current
        if (!currentAudio) {
          console.error("preloadAudio: 音频元素不存在")
          return
        }

        console.log("preloadAudio: readyState =", currentAudio.readyState, "duration =", currentAudio.duration)

        if (currentAudio.readyState >= 1) {
          // HAVE_METADATA，可以设置 currentTime
          // 预加载到最大位置（但不播放）
          if (maxEndTime > 0 && currentAudio.duration > maxEndTime) {
            currentAudio.currentTime = maxEndTime
            // 等待加载到该位置
            let checkTimer: NodeJS.Timeout | null = null
            const checkLoaded = () => {
              const checkAudio = backingAudioRef.current
              if (!checkAudio) {
                return
              }

              if (checkAudio.readyState >= 3) {
                // HAVE_FUTURE_DATA，已经加载到目标位置
                console.log("音频预加载完成，已加载到", maxEndTime, "秒")
                // 重置到开头，准备播放
                checkAudio.currentTime = 0
                setIsAudioLoaded(true)
                isAudioLoadedRef.current = true
              } else {
                // 继续等待，直到加载完成
                checkTimer = setTimeout(checkLoaded, 100)
              }
            }
            checkTimer = setTimeout(checkLoaded, 100)
            if (checkTimer) {
              cleanupFunctions.push(() => {
                if (checkTimer) clearTimeout(checkTimer)
              })
            }
          } else {
            // 如果不需要预加载到特定位置，等待 canplaythrough 事件
            console.log("不需要预加载到特定位置，等待 canplaythrough 事件")
          }
        } else {
          // 等待元数据加载
          console.log("等待元数据加载...")
          currentAudio.addEventListener("loadedmetadata", preloadAudio, { once: true })
        }
      }

      // 监听 canplaythrough 事件（音频可以完整播放）- 这是真正的加载完成标志
      const handleCanPlayThrough = () => {
        console.log("音频可以完整播放")
        const currentAudio = backingAudioRef.current
        if (!currentAudio) return

        // 如果需要预加载到特定位置，检查是否已经预加载完成
        if (maxEndTime > 0 && currentAudio.duration > maxEndTime) {
          // 检查是否已经预加载到目标位置
          if (currentAudio.readyState >= 3) {
            // 尝试设置到目标位置，确保已加载
            currentAudio.currentTime = maxEndTime
            // 等待一下，确保位置设置成功
            setTimeout(() => {
              currentAudio.currentTime = 0
              setIsAudioLoaded(true)
              isAudioLoadedRef.current = true
            }, 100)
          } else {
            // 如果还没加载到目标位置，继续等待
            preloadAudio()
          }
        } else {
          // 不需要预加载，直接标记为已加载
          setIsAudioLoaded(true)
          isAudioLoadedRef.current = true
        }
      }

      // 强制重新加载音频（确保每次都是全新的加载）
      // 通过修改 src 来触发重新加载
      audio.src = ""
      audio.src = song.backingTrackUrl
      audio.load()

      console.log("音频加载命令已发送，readyState:", audio.readyState)

      // 如果音频已经可以播放，检查是否需要预加载
      if (audio.readyState >= 3) {
        console.log("音频已经可以播放")
        if (maxEndTime > 0 && audio.duration > maxEndTime) {
          // 需要预加载到特定位置
          preloadAudio()
        } else {
          // 不需要预加载，直接标记为已加载
          setIsAudioLoaded(true)
          isAudioLoadedRef.current = true
        }
      } else {
        // 等待加载
        preloadAudio()
      }

      // 监听错误事件
      audio.addEventListener("error", handleError)

      // 监听 canplaythrough 事件（音频可以完整播放）
      audio.addEventListener("canplaythrough", handleCanPlayThrough, {
        once: true,
      })

      // 添加事件监听器清理
      cleanupFunctions.push(() => {
        const cleanupAudio = backingAudioRef.current
        if (cleanupAudio) {
          cleanupAudio.removeEventListener("error", handleError)
          cleanupAudio.removeEventListener("canplaythrough", handleCanPlayThrough)
          cleanupAudio.removeEventListener("loadedmetadata", preloadAudio)
        }
      })
    }, 100) // 延迟 100ms 确保 DOM 已渲染

    cleanupFunctions.push(() => clearTimeout(initTimer))

    return () => {
      cleanupFunctions.forEach((fn) => fn())
    }
  }, [userId, song.backingTrackUrl, userSegments])

  // 更新播放进度
  useEffect(() => {
    if (playingRecordingId) {
      const recording = recordings.find((r) => r.id === playingRecordingId)
      if (!recording) return

      const updateTimer = setInterval(() => {
        const audio = playingAudioRefs.current.get(playingRecordingId)
        if (audio && !audio.paused) {
          const actualDuration = audio.duration
          const maxDuration = recording.endTime - recording.startTime
          const stopTime = Math.min(actualDuration, maxDuration)

          if (audio.currentTime >= stopTime - 0.1) {
            audio.pause()
            audio.currentTime = 0
            setPlayingRecordingId(null)
            return
          }

          setRecordingPlaybackTimes((prev) =>
            new Map(prev).set(playingRecordingId, audio.currentTime)
          )
        }
      }, 30)

      return () => clearInterval(updateTimer)
    }
  }, [playingRecordingId, recordings])

  // 更新伴奏播放进度
  useEffect(() => {
    if (playingWithBackingId) {
      const recording = recordings.find((r) => r.id === playingWithBackingId)
      if (!recording || !backingAudioRef.current) return

      const updateTimer = setInterval(() => {
        const audio = playingAudioRefs.current.get(playingWithBackingId)
        const backing = backingAudioRef.current

        if (audio && backing && !audio.paused && !backing.paused) {
          const maxDuration = recording.endTime - recording.startTime

          // 检查是否播放完成
          if (
            audio.currentTime >= maxDuration - 0.1 ||
            backing.currentTime >= recording.endTime
          ) {
            audio.pause()
            backing.pause()
            setPlayingWithBackingId(null)
            return
          }

          setBackingPlaybackTime(backing.currentTime)
        }
      }, 30)

      return () => clearInterval(updateTimer)
    }
  }, [playingWithBackingId, recordings])

  // 更新原曲播放进度
  useEffect(() => {
    // 清理所有旧的定时器
    originalPlaybackIntervalRefs.current.forEach((timer) => {
      clearInterval(timer)
    })
    originalPlaybackIntervalRefs.current.clear()

    // 为每个正在播放的段落创建定时器
    isPlayingOriginal.forEach((isPlaying, segmentIndex) => {
      if (isPlaying) {
        const timer = setInterval(() => {
          const audio = originalAudioRefs.current.get(segmentIndex)
          if (audio && !audio.paused) {
            const segment = userSegments[segmentIndex]
            if (!segment) return

            const timeRange = getTimeRangeByLineIds(
              segment.startLineId,
              segment.endLineId
            )
            const { startTime, endTime } = timeRange

            // 检查是否播放完成
            if (audio.currentTime >= endTime - 0.1) {
              audio.pause()
              audio.currentTime = startTime
              setIsPlayingOriginal((prev) => {
                const newMap = new Map(prev)
                newMap.set(segmentIndex, false)
                return newMap
              })
              const interval =
                originalPlaybackIntervalRefs.current.get(segmentIndex)
              if (interval) {
                clearInterval(interval)
                originalPlaybackIntervalRefs.current.delete(segmentIndex)
              }
              return
            }

            setOriginalPlaybackTime((prev) => {
              const newMap = new Map(prev)
              newMap.set(segmentIndex, audio.currentTime)
              return newMap
            })
          }
        }, 30)

        originalPlaybackIntervalRefs.current.set(segmentIndex, timer)
      }
    })

    return () => {
      originalPlaybackIntervalRefs.current.forEach((timer) => {
        clearInterval(timer)
      })
      originalPlaybackIntervalRefs.current.clear()
    }
  }, [isPlayingOriginal, userSegments])

  const fetchRecordings = async () => {
    try {
      const response = await fetch(
        `/api/chain-recordings?songId=${song.id}&t=${Date.now()}`,
        {
          cache: "no-store",
        }
      )
      if (response.ok) {
        const data = await response.json()
        setRecordings(data)
      }
    } catch (error) {
      console.error("Failed to fetch recordings:", error)
    }
  }

  const startRecording = async (segmentIndex: number) => {
    try {
      const segment = userSegments[segmentIndex]
      if (!segment) return

      const timeRange = getTimeRangeByLineIds(
        segment.startLineId,
        segment.endLineId
      )
      const { startTime, endTime } = timeRange

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // 使用最佳的 MIME 类型创建 MediaRecorder
      const options: MediaRecorderOptions = {}
      if (audioMimeType && MediaRecorder.isTypeSupported(audioMimeType)) {
        options.mimeType = audioMimeType
      }

      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRefs.current.set(segmentIndex, mediaRecorder)
      audioChunksRefs.current.set(segmentIndex, [])

      mediaRecorder.ondataavailable = (event) => {
        const chunks = audioChunksRefs.current.get(segmentIndex) || []
        chunks.push(event.data)
        audioChunksRefs.current.set(segmentIndex, chunks)
      }

      mediaRecorder.onstop = async () => {
        const chunks = audioChunksRefs.current.get(segmentIndex) || []
        let audioBlob = new Blob(chunks, { type: audioMimeType })

        // iOS 上如果是 WebM，尝试转换为 WAV
        if (isIOS() && audioMimeType.includes("webm")) {
          try {
            audioBlob = await convertBlobToWav(audioBlob)
          } catch (error) {
            console.error(
              "Failed to convert to WAV, using original blob:",
              error
            )
          }
        }

        const url = URL.createObjectURL(audioBlob)

        setSegmentStates((prev) => {
          const newMap = new Map(prev)
          const state = newMap.get(segmentIndex) || {
            isRecording: false,
            recordedAudio: null,
            recordedAudioUrl: null,
            recordingTime: 0,
            currentBackingTime: 0,
          }
          newMap.set(segmentIndex, {
            ...state,
            recordedAudio: audioBlob,
            recordedAudioUrl: url,
          })
          return newMap
        })

        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()

      setSegmentStates((prev) => {
        const newMap = new Map(prev)
        const state = newMap.get(segmentIndex) || {
          isRecording: false,
          recordedAudio: null,
          recordedAudioUrl: null,
          recordingTime: 0,
          currentBackingTime: 0,
        }
        newMap.set(segmentIndex, { ...state, isRecording: true })
        return newMap
      })

      // 等待音频加载完成后再播放伴奏
      if (backingAudioRef.current) {
        const audio = backingAudioRef.current

        // 等待音频可以播放
        const startPlayback = async () => {
          try {
            // 先等待音频加载到至少 HAVE_METADATA 状态（readyState >= 1）
            // 这样才能设置 currentTime
            if (audio.readyState < 1) {
              await new Promise<void>((resolve) => {
                const onLoadedMetadata = () => {
                  audio.removeEventListener("loadedmetadata", onLoadedMetadata)
                  resolve()
                }
                audio.addEventListener("loadedmetadata", onLoadedMetadata)

                // 设置超时，避免无限等待
                setTimeout(() => {
                  audio.removeEventListener("loadedmetadata", onLoadedMetadata)
                  resolve()
                }, 3000)
              })
            }

            // 现在设置播放位置（必须在加载元数据之后）
            audio.currentTime = startTime

            // 等待音频加载到可以播放的状态
            if (audio.readyState < 3) {
              // HAVE_FUTURE_DATA
              await new Promise<void>((resolve) => {
                const onCanPlay = () => {
                  audio.removeEventListener("canplay", onCanPlay)
                  resolve()
                }
                audio.addEventListener("canplay", onCanPlay)

                // 设置超时，避免无限等待
                setTimeout(() => {
                  audio.removeEventListener("canplay", onCanPlay)
                  resolve()
                }, 2000)
              })
            }

            // 再次确认播放位置（防止在等待过程中被重置）
            if (Math.abs(audio.currentTime - startTime) > 0.5) {
              audio.currentTime = startTime
              // 等待位置更新
              await new Promise((resolve) => setTimeout(resolve, 100))
            }

            // 开始播放
            await audio.play()

            // 确认播放真正开始后，再启动计时器
            const onPlaying = () => {
              audio.removeEventListener("playing", onPlaying)

              // 记录实际开始时间（确保不会是负数）
              const actualStartTime = Math.max(
                startTime,
                backingAudioRef.current?.currentTime || startTime
              )

              // 录音计时
              const updateTimer = setInterval(() => {
                const currentTime = backingAudioRef.current?.currentTime || 0

                if (currentTime >= endTime) {
                  stopRecording(segmentIndex)
                } else {
                  // 计算录音时间（确保不会是负数）
                  const elapsed = Math.max(0, currentTime - actualStartTime)

                  setSegmentStates((prev) => {
                    const newMap = new Map(prev)
                    const state = newMap.get(segmentIndex) || {
                      isRecording: false,
                      recordedAudio: null,
                      recordedAudioUrl: null,
                      recordingTime: 0,
                      currentBackingTime: 0,
                    }
                    newMap.set(segmentIndex, {
                      ...state,
                      recordingTime: Math.floor(elapsed * 10) / 10,
                      currentBackingTime: currentTime,
                    })
                    return newMap
                  })
                }
              }, 50)

              recordingIntervalRefs.current.set(segmentIndex, updateTimer)
              toast.success(`开始录制第 ${segmentIndex + 1} 部分`)
            }

            audio.addEventListener("playing", onPlaying)

            // 设置超时，避免无限等待 playing 事件
            setTimeout(() => {
              audio.removeEventListener("playing", onPlaying)
              // 如果超时仍未触发，手动启动计时器
              if (!recordingIntervalRefs.current.has(segmentIndex)) {
                onPlaying()
              }
            }, 1000)
          } catch (error) {
            console.error("Failed to play backing track:", error)
            toast.error("播放伴奏失败，请重试")
          }
        }

        startPlayback()
      }
    } catch (error) {
      console.error("Failed to start recording:", error)
      toast.error("无法访问麦克风")
    }
  }

  const stopRecording = (segmentIndex: number) => {
    const mediaRecorder = mediaRecorderRefs.current.get(segmentIndex)
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop()

      setSegmentStates((prev) => {
        const newMap = new Map(prev)
        const state = newMap.get(segmentIndex) || {
          isRecording: false,
          recordedAudio: null,
          recordedAudioUrl: null,
          recordingTime: 0,
          currentBackingTime: 0,
        }
        newMap.set(segmentIndex, { ...state, isRecording: false })
        return newMap
      })

      if (backingAudioRef.current) {
        backingAudioRef.current.pause()
      }

      const timer = recordingIntervalRefs.current.get(segmentIndex)
      if (timer) {
        clearInterval(timer)
        recordingIntervalRefs.current.delete(segmentIndex)
      }

      toast.success("录音已停止")
    }
  }

  const uploadRecording = async (segmentIndex: number) => {
    const state = segmentStates.get(segmentIndex)
    if (!state?.recordedAudio) {
      toast.error("请先录音")
      return
    }

    const segment = userSegments[segmentIndex]
    if (!segment) return

    const timeRange = getTimeRangeByLineIds(
      segment.startLineId,
      segment.endLineId
    )
    const { startTime, endTime } = timeRange

    setIsUploading(true)
    try {
      // 先删除该用户在该时间段的旧录音
      const oldRecordings = recordings.filter(
        (r) =>
          r.startTime === startTime &&
          r.endTime === endTime &&
          r.userId === userId
      )

      for (const oldRecording of oldRecordings) {
        await fetch(`/api/chain-recordings/${oldRecording.id}`, {
          method: "DELETE",
        })
      }

      // 上传新录音
      const formData = new FormData()
      const fileExtension = getFileExtension(audioMimeType)
      formData.append("file", state.recordedAudio, `recording.${fileExtension}`)
      formData.append("songId", song.id)
      formData.append("userId", userId)
      formData.append("startTime", String(startTime))
      formData.append("endTime", String(endTime))
      formData.append("startLineId", String(segment.startLineId))
      formData.append("endLineId", String(segment.endLineId))

      const response = await fetch("/api/chain-recordings", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        toast.success(`第 ${segmentIndex + 1} 部分已上传`)

        setSegmentStates((prev) => {
          const newMap = new Map(prev)
          newMap.set(segmentIndex, {
            isRecording: false,
            recordedAudio: null,
            recordedAudioUrl: null,
            recordingTime: 0,
            currentBackingTime: 0,
          })
          return newMap
        })

        audioChunksRefs.current.delete(segmentIndex)
        setRerecordingSegments((prev) => {
          const newSet = new Set(prev)
          newSet.delete(segmentIndex)
          return newSet
        })
        fetchRecordings()
      } else {
        toast.error("上传失败")
      }
    } catch (error) {
      console.error("Failed to upload recording:", error)
      toast.error("上传失败")
    } finally {
      setIsUploading(false)
    }
  }

  const togglePlayRecording = (recordingId: string) => {
    const audio = playingAudioRefs.current.get(recordingId)
    if (!audio) return

    const recording = recordings.find((r) => r.id === recordingId)
    if (!recording) return

    if (playingRecordingId === recordingId) {
      audio.pause()
      setPlayingRecordingId(null)
    } else {
      // 停止其他单独播放
      playingAudioRefs.current.forEach((a, id) => {
        if (id !== recordingId) {
          a.pause()
        }
      })

      // 停止伴奏播放
      if (backingAudioRef.current) {
        backingAudioRef.current.pause()
      }
      setPlayingWithBackingId(null)

      audio.currentTime = 0
      audio.play().catch((error) => {
        console.error("Failed to play recording:", error)
      })

      setPlayingRecordingId(recordingId)
    }
  }

  const togglePlayWithBacking = async (recordingId: string) => {
    const recording = recordings.find((r) => r.id === recordingId)
    if (!recording || !backingAudioRef.current) return

    if (playingWithBackingId === recordingId) {
      backingAudioRef.current.pause()
      const audio = playingAudioRefs.current.get(recordingId)
      if (audio) audio.pause()
      setPlayingWithBackingId(null)
    } else {
      // 停止所有单独播放
      playingAudioRefs.current.forEach((a) => a.pause())
      setPlayingRecordingId(null)

      // 停止其他伴奏播放
      if (backingAudioRef.current) {
        backingAudioRef.current.pause()
      }

      // 设置播放状态
      setPlayingWithBackingId(recordingId)

      const audio = playingAudioRefs.current.get(recordingId)
      const backing = backingAudioRef.current

      if (!audio || !backing) return

      // 确保两个音频都加载完成
      const ensureLoaded = (audioElement: HTMLAudioElement) => {
        return new Promise<void>((resolve) => {
          if (audioElement.readyState >= 3) {
            // HAVE_FUTURE_DATA
            resolve()
          } else {
            const onCanPlay = () => {
              audioElement.removeEventListener("canplay", onCanPlay)
              resolve()
            }
            audioElement.addEventListener("canplay", onCanPlay)
          }
        })
      }

      try {
        // 预设播放位置
        audio.currentTime = 0
        backing.currentTime = recording.startTime

        // 等待两个音频都加载完成
        await Promise.all([ensureLoaded(audio), ensureLoaded(backing)])

        // 同时播放
        await Promise.all([audio.play(), backing.play()])
      } catch (error) {
        console.error("Failed to play with backing:", error)
        setPlayingWithBackingId(null)
      }
    }
  }

  const discardRecording = (segmentIndex: number) => {
    setSegmentStates((prev) => {
      const newMap = new Map(prev)
      newMap.set(segmentIndex, {
        isRecording: false,
        recordedAudio: null,
        recordedAudioUrl: null,
        recordingTime: 0,
        currentBackingTime: 0,
      })
      return newMap
    })
    audioChunksRefs.current.delete(segmentIndex)
    toast.info(`已丢弃第 ${segmentIndex + 1} 部分的录音`)
  }

  const togglePlayOriginal = async (segmentIndex: number) => {
    if (!song.originalUrl) {
      toast.error("原版歌曲未配置")
      return
    }

    const segment = userSegments[segmentIndex]
    if (!segment) return

    const timeRange = getTimeRangeByLineIds(
      segment.startLineId,
      segment.endLineId
    )
    const { startTime, endTime } = timeRange

    // 获取或创建音频元素
    let audio = originalAudioRefs.current.get(segmentIndex)
    if (!audio) {
      audio = new Audio(song.originalUrl)
      audio.volume = 0.8
      originalAudioRefs.current.set(segmentIndex, audio)

      // 监听播放结束
      audio.addEventListener("ended", () => {
        setIsPlayingOriginal((prev) => {
          const newMap = new Map(prev)
          newMap.set(segmentIndex, false)
          return newMap
        })
        const interval = originalPlaybackIntervalRefs.current.get(segmentIndex)
        if (interval) {
          clearInterval(interval)
          originalPlaybackIntervalRefs.current.delete(segmentIndex)
        }
      })
    }

    const currentlyPlaying = isPlayingOriginal.get(segmentIndex) || false

    if (currentlyPlaying) {
      // 停止播放
      audio.pause()
      audio.currentTime = startTime
      setIsPlayingOriginal((prev) => {
        const newMap = new Map(prev)
        newMap.set(segmentIndex, false)
        return newMap
      })
      const interval = originalPlaybackIntervalRefs.current.get(segmentIndex)
      if (interval) {
        clearInterval(interval)
        originalPlaybackIntervalRefs.current.delete(segmentIndex)
      }
      setOriginalPlaybackTime((prev) => {
        const newMap = new Map(prev)
        newMap.set(segmentIndex, 0)
        return newMap
      })
    } else {
      // 开始播放
      // 停止其他播放
      originalAudioRefs.current.forEach((a, idx) => {
        if (idx !== segmentIndex) {
          a.pause()
          setIsPlayingOriginal((prev) => {
            const newMap = new Map(prev)
            newMap.set(idx, false)
            return newMap
          })
        }
      })
      if (backingAudioRef.current) {
        backingAudioRef.current.pause()
      }
      playingAudioRefs.current.forEach((a) => a.pause())
      setPlayingRecordingId(null)
      setPlayingWithBackingId(null)

      try {
        // 设置播放位置
        audio.currentTime = startTime

        // 等待音频加载
        if (audio.readyState < 3) {
          await new Promise<void>((resolve) => {
            const onCanPlay = () => {
              audio.removeEventListener("canplay", onCanPlay)
              resolve()
            }
            audio.addEventListener("canplay", onCanPlay)
            setTimeout(() => {
              audio.removeEventListener("canplay", onCanPlay)
              resolve()
            }, 2000)
          })
        }

        // 开始播放
        await audio.play()

        setIsPlayingOriginal((prev) => {
          const newMap = new Map(prev)
          newMap.set(segmentIndex, true)
          return newMap
        })

        setOriginalPlaybackTime((prev) => {
          const newMap = new Map(prev)
          newMap.set(segmentIndex, startTime)
          return newMap
        })

        toast.success(`开始播放原曲（第 ${segmentIndex + 1} 部分）`)
      } catch (error) {
        console.error("Failed to play original:", error)
        toast.error("播放原曲失败")
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* 隐藏的音频元素 - 预加载（始终渲染，避免重复创建） */}
      <audio ref={backingAudioRef} src={song.backingTrackUrl} preload="auto" />

      {/* 如果音频未加载完成，显示加载提示 */}
      {!isAudioLoaded && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-gray-400 text-sm">正在加载音频...</p>
          </CardContent>
        </Card>
      )}

      {/* 如果音频已加载，显示主要内容 */}
      {isAudioLoaded && (
        <>

      {/* 总体进度 */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">录音进度</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">已录音人数</p>
              <p className="text-3xl font-bold text-purple-400">
                {Array.from(new Set(recordings.map((r) => r.userId))).length}
              </p>
              {recordings.length > 0 && (
                <div className="mt-2">
                  {Array.from(new Set(recordings.map((r) => r.userId))).map(
                    (uid, index, array) => (
                      <span key={uid} className="text-xs text-gray-300">
                        {uid}
                        {index < array.length - 1 ? ", " : ""}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>
            <div className="bg-slate-900/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">你的部分</p>
              <div className="space-y-1">
                {userSegments.map((segment, idx) => {
                  const userRecorded = recordings.some((r) => {
                    if (r.userId !== userId) return false
                    // 优先使用 lineId 判断（新录音）
                    if (
                      r.startLineId !== undefined &&
                      r.endLineId !== undefined
                    ) {
                      return (
                        r.startLineId === segment.startLineId &&
                        r.endLineId === segment.endLineId
                      )
                    }
                    // 兼容旧录音，使用时间判断
                    const timeRange = getTimeRangeByLineIds(
                      segment.startLineId,
                      segment.endLineId
                    )
                    return (
                      Math.abs(r.startTime - timeRange.startTime) < 0.01 &&
                      Math.abs(r.endTime - timeRange.endTime) < 0.01
                    )
                  })
                  return (
                    <p
                      key={idx}
                      className={`text-sm font-semibold ${
                        userRecorded ? "text-green-400" : "text-gray-300"
                      }`}
                    >
                      {userRecorded ? "✓" : "○"} {idx + 1}：
                      {segment.startLineId}-{segment.endLineId} 句
                    </p>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 每个部分的录音卡片 */}
      {userSegments.map((segment, segmentIndex) => {
        const timeRange = getTimeRangeByLineIds(
          segment.startLineId,
          segment.endLineId
        )
        const { startTime, endTime } = timeRange
        const state = segmentStates.get(segmentIndex)
        const allSegmentRecordings = recordings.filter((r) => {
          // 只显示当前用户的录音
          if (r.userId !== userId) return false
          // 优先使用 lineId 判断（新录音）
          if (r.startLineId !== undefined && r.endLineId !== undefined) {
            return (
              r.startLineId === segment.startLineId &&
              r.endLineId === segment.endLineId
            )
          }
          // 兼容旧录音，使用时间判断
          return (
            Math.abs(r.startTime - startTime) < 0.01 &&
            Math.abs(r.endTime - endTime) < 0.01
          )
        })
        // 只显示最新的一个录音
        const segmentRecordings =
          allSegmentRecordings.length > 0
            ? [
                allSegmentRecordings.sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )[0],
              ]
            : []
        const userRecorded = segmentRecordings.some((r) => r.userId === userId)
        const isRerecording = rerecordingSegments.has(segmentIndex)

        return (
          <div key={`${userId}-${segmentIndex}`} className="space-y-4">
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
                    <p className="text-gray-400 text-sm mb-3">
                      你要唱的歌词（
                      {commonSegments.some(
                        (cs) =>
                          cs.startLineId === segment.startLineId &&
                          cs.endLineId === segment.endLineId
                      )
                        ? "可以选择唱和声哦～"
                        : "大声点哦～"}
                      ）
                    </p>
                    <div className="space-y-1">
                      {getLyricsByRange(
                        segment.startLineId,
                        segment.endLineId
                      ).map((lyric) => (
                        <div key={lyric.id} className="flex gap-2 text-sm">
                          <span className="text-purple-400 font-semibold flex-shrink-0 w-5">
                            {lyric.id}.
                          </span>
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
                      {/* 卡拉OK显示 - 录音时或播放原曲时显示 */}
                      {(state?.isRecording ||
                        isPlayingOriginal.get(segmentIndex) ||
                        false) && (
                        <KaraokeDisplay
                          currentTime={
                            state?.isRecording
                              ? state.currentBackingTime
                              : originalPlaybackTime.get(segmentIndex) || 0
                          }
                          isPlaying={
                            state?.isRecording ||
                            isPlayingOriginal.get(segmentIndex) ||
                            false
                          }
                          userStartLineId={segment.startLineId}
                          userEndLineId={segment.endLineId}
                        />
                      )}

                      {/* 进度条 - 录音时 */}
                      {state?.isRecording && (
                        <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-red-600 h-full transition-all duration-100"
                            style={{
                              width: `${
                                (state.recordingTime / (endTime - startTime)) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      )}

                      {/* 进度条 - 播放原曲时 */}
                      {(isPlayingOriginal.get(segmentIndex) || false) && (
                        <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-purple-600 h-full transition-all duration-100"
                            style={{
                              width: `${
                                (((originalPlaybackTime.get(segmentIndex) ||
                                  0) -
                                  startTime) /
                                  (endTime - startTime)) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      )}

                      {/* 时间显示 - 录音时 */}
                      {state?.isRecording && (
                        <div className="text-center text-sm text-gray-400">
                          {state.recordingTime.toFixed(1)}s /{" "}
                          {(endTime - startTime).toFixed(0)}s
                        </div>
                      )}

                      {/* 时间显示 - 播放原曲时 */}
                      {(isPlayingOriginal.get(segmentIndex) || false) && (
                        <div className="text-center text-sm text-gray-400">
                          {(
                            (originalPlaybackTime.get(segmentIndex) || 0) -
                            startTime
                          ).toFixed(1)}
                          s / {(endTime - startTime).toFixed(0)}s
                        </div>
                      )}

                      {/* 录音按钮和听原曲按钮 */}
                      <div className="flex gap-2">
                        {!state?.isRecording ? (
                          <>
                            <Button
                              onClick={() => startRecording(segmentIndex)}
                              disabled={
                                isPlayingOriginal.get(segmentIndex) || false
                              }
                              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50"
                            >
                              <Mic className="w-4 h-4" />
                              开始录音
                            </Button>
                            {song.originalUrl && (
                              <Button
                                onClick={() => togglePlayOriginal(segmentIndex)}
                                variant="outline"
                                className="flex items-center justify-center gap-2 border-purple-500 text-purple-400 hover:bg-purple-500/10"
                              >
                                <Headphones className="w-4 h-4" />
                                {isPlayingOriginal.get(segmentIndex)
                                  ? "停止"
                                  : "听原曲"}
                              </Button>
                            )}
                          </>
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
                        <p className="text-green-400 font-semibold text-sm mb-2">
                          ✓ 已录音
                        </p>
                        <audio
                          src={state.recordedAudioUrl || ""}
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
                          {isUploading ? "上传中..." : "上传"}
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
                    <span className="text-green-400 text-sm font-normal">
                      ✓ 已录制
                    </span>
                  </CardTitle>
                </CardHeader>
              </Card>
            )}

            {/* 该部分的已录音列表 */}
            {segmentRecordings.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">
                    第 {segmentIndex + 1} 部分的录音
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {segmentRecordings.map((recording, index) => {
                      const currentTime =
                        recordingPlaybackTimes.get(recording.id) || 0
                      const maxDuration =
                        recording.endTime - recording.startTime
                      const actualDuration =
                        recordingDurations.get(recording.id) || maxDuration
                      const displayDuration = Math.min(
                        actualDuration,
                        maxDuration
                      )
                      const progress = (currentTime / displayDuration) * 100

                      return (
                        <div
                          key={recording.id}
                          className="bg-slate-900/50 p-3 rounded-lg space-y-2"
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                              <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold">
                                  {recording.userId}
                                </p>
                                <p className="text-gray-400 text-sm">
                                  {recording.startTime.toFixed(0)}-
                                  {recording.endTime.toFixed(0)}s
                                </p>
                              </div>
                            </div>
                            <audio
                              ref={(el) => {
                                if (el) {
                                  playingAudioRefs.current.set(recording.id, el)
                                }
                              }}
                              src={recording.audioUrl}
                              onEnded={() => setPlayingRecordingId(null)}
                              onLoadedMetadata={(e) => {
                                const audio = e.currentTarget
                                if (audio.duration && audio.duration > 0) {
                                  setRecordingDurations((prev) =>
                                    new Map(prev).set(
                                      recording.id,
                                      audio.duration
                                    )
                                  )
                                }
                              }}
                            />
                            <div className="flex gap-2 w-full">
                              <Button
                                onClick={() =>
                                  togglePlayWithBacking(recording.id)
                                }
                                size="sm"
                                variant="outline"
                                className="flex-1"
                              >
                                {playingWithBackingId === recording.id
                                  ? "停止"
                                  : "带伴奏播放 (很可能不同步)"}
                              </Button>
                              <Button
                                onClick={() =>
                                  togglePlayRecording(recording.id)
                                }
                                size="sm"
                                variant="outline"
                                className="flex-1"
                              >
                                {playingRecordingId === recording.id
                                  ? "暂停"
                                  : "播放"}
                              </Button>
                              {recording.userId === userId && (
                                <Button
                                  onClick={() => {
                                    setSegmentStates((prev) => {
                                      const newMap = new Map(prev)
                                      newMap.set(segmentIndex, {
                                        isRecording: false,
                                        recordedAudio: null,
                                        recordedAudioUrl: null,
                                        recordingTime: 0,
                                        currentBackingTime: 0,
                                      })
                                      return newMap
                                    })
                                    audioChunksRefs.current.delete(segmentIndex)
                                    setRerecordingSegments((prev) =>
                                      new Set(prev).add(segmentIndex)
                                    )
                                    toast.info(
                                      `准备重新录制第 ${segmentIndex + 1} 部分`
                                    )
                                  }}
                                  size="sm"
                                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                                >
                                  重录
                                </Button>
                              )}
                            </div>
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
                                  style={{
                                    width: `${
                                      ((backingPlaybackTime -
                                        recording.startTime) /
                                        (recording.endTime -
                                          recording.startTime)) *
                                      100
                                    }%`,
                                  }}
                                />
                              </div>
                              <div className="flex justify-between text-xs text-gray-400">
                                <span>
                                  {(
                                    backingPlaybackTime - recording.startTime
                                  ).toFixed(1)}
                                  s
                                </span>
                                <span>
                                  {(
                                    recording.endTime - recording.startTime
                                  ).toFixed(0)}
                                  s
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )
      })}
        </>
      )}
    </div>
  )
}
