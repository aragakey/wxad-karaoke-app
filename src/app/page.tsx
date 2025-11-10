"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Music, Mic } from "lucide-react"
import ChainRecorder from "@/components/ChainRecorder"
import CircleKaraoke from "@/components/CircleKaraoke"
import { USER_ASSIGNMENTS } from "@/lib/lyrics"
import { toast } from "sonner"

// 默认歌曲配置
const DEFAULT_SONG = {
  id: "default-song",
  title: "Monday (feat. Lionman)",
  artist: "窦靖童",
  backingTrackUrl:
    "https://wxa.wxs.qq.com/wxad-design/yijie/monday-original-music.mp3",
  originalUrl: "https://wxa.wxs.qq.com/wxad-design/yijie/monday-original.mp3",
  finalMixUrl: "https://wxa.wxs.qq.com/wxad-design/yijie/monday-1109-to-lianxun.MP3",
}

export default function Home() {
  const [userId, setUserId] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 从登录系统获取用户ID
    const storedUserId = localStorage.getItem("userId")
    if (storedUserId) {
      setUserId(storedUserId)
      setIsLoggedIn(true)
    }
    setIsLoading(false)
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId.trim()) {
      toast.error("请输入用户ID")
      return
    }
    if (!password.trim()) {
      toast.error("请输入密码")
      return
    }

    // 验证用户ID和密码
    const user = USER_ASSIGNMENTS.find((u) => u.userId === userId.toLowerCase())
    if (!user) {
      toast.error("用户不存在")
      return
    }

    if (user.password.toLowerCase() !== password.toLowerCase()) {
      toast.error("密码错误")
      return
    }

    // 登录成功
    localStorage.setItem("userId", userId.toLowerCase())
    setIsLoggedIn(true)
    toast.success("登录成功")
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Music className="w-12 h-12 text-purple-600" />
            </div>
            <CardTitle className="flex items-center justify-center text-2xl">
              wxad des
              <svg
                className="relative bottom-0.5 -mx-2.5 size-7"
                viewBox="0 0 512 512"
              >
                <path
                  d="M256.4 32c-35.1.1-65.8 23.2-76.8 59.3-5.6 18.5-3.5 44.8-1.2 54.5 2.3 9.7 7.3 19.9 13.2 28.3 2.8 4.2 6.7 7.4 11.2 9.2.6.3 1.3.5 2 .8 3.3 1.1 6.5 2.2 10.1 3.1 11.8 3 27.1 4.7 41.1 4.8h2v-.1c14-.1 27.3-1.7 39.1-4.8 3.6-.9 6.9-2 10.2-3.1.7-.2 1.3-.5 1.9-.8 4.5-1.8 8.4-5 11.2-9.2 5.9-8.4 10.8-18.6 13.2-28.3 2.3-9.7 4.4-36-1.2-54.5-11-36-40.8-59.1-76-59.2z"
                  fill="currentColor"
                />
                <path
                  d="M295.3 201.1c-.4 0-.7 0-1.1.1-.6.1-1.3.3-1.9.4-2 .4-4.1.8-6.1 1.2-9.2 1.5-18.9 2.3-29 2.4-10.1-.1-22.3-.9-31-2.4-2.1-.4-4.2-.8-6.2-1.2-.6-.1-1.3-.3-1.9-.4-.4-.1-.8-.1-1.1-.1-6.1 0-11 5.3-11.2 11.9.1.8.2 1.6.2 2.4 4.8 67.2 16.8 240.7 18.2 252 0 0 2.8 12.7 32.1 12.6 29.2.1 32.1-12.6 32.1-12.6 1.4-11.3 13.4-184.8 18.2-252 0-.8.1-1.6.2-2.4-.5-6.6-5.4-11.9-11.5-11.9zM266 281.7c0 6-4.5 10.9-10 10.9s-10-4.9-10-10.9V249c0-6 4.5-10.9 10-10.9s10 4.9 10 10.9v32.7z"
                  fill="currentColor"
                />
              </svg>
              gn karaoke
            </CardTitle>
            <CardDescription>
              让我们一起录一首歌吧～每个人录自己固定的部分，天使最终会合起来～
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userId">用户ID</Label>
                <Input
                  id="userId"
                  placeholder="输入企微全名，小写"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="输入给你的密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-base"
                />
              </div>
              <Button type="submit" className="w-full" size="lg">
                进入
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/50 backdrop-blur border-b border-purple-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="flex items-center text-base md:text-2xl font-bold text-white">
              wxad des
              <svg
                className="relative bottom-0.5 -mx-1.5 md:-mx-2.5 size-5 md:size-7"
                viewBox="0 0 512 512"
              >
                <path
                  d="M256.4 32c-35.1.1-65.8 23.2-76.8 59.3-5.6 18.5-3.5 44.8-1.2 54.5 2.3 9.7 7.3 19.9 13.2 28.3 2.8 4.2 6.7 7.4 11.2 9.2.6.3 1.3.5 2 .8 3.3 1.1 6.5 2.2 10.1 3.1 11.8 3 27.1 4.7 41.1 4.8h2v-.1c14-.1 27.3-1.7 39.1-4.8 3.6-.9 6.9-2 10.2-3.1.7-.2 1.3-.5 1.9-.8 4.5-1.8 8.4-5 11.2-9.2 5.9-8.4 10.8-18.6 13.2-28.3 2.3-9.7 4.4-36-1.2-54.5-11-36-40.8-59.1-76-59.2z"
                  fill="currentColor"
                />
                <path
                  d="M295.3 201.1c-.4 0-.7 0-1.1.1-.6.1-1.3.3-1.9.4-2 .4-4.1.8-6.1 1.2-9.2 1.5-18.9 2.3-29 2.4-10.1-.1-22.3-.9-31-2.4-2.1-.4-4.2-.8-6.2-1.2-.6-.1-1.3-.3-1.9-.4-.4-.1-.8-.1-1.1-.1-6.1 0-11 5.3-11.2 11.9.1.8.2 1.6.2 2.4 4.8 67.2 16.8 240.7 18.2 252 0 0 2.8 12.7 32.1 12.6 29.2.1 32.1-12.6 32.1-12.6 1.4-11.3 13.4-184.8 18.2-252 0-.8.1-1.6.2-2.4-.5-6.6-5.4-11.9-11.5-11.9zM266 281.7c0 6-4.5 10.9-10 10.9s-10-4.9-10-10.9V249c0-6 4.5-10.9 10-10.9s10 4.9 10 10.9v32.7z"
                  fill="currentColor"
                />
              </svg>
              gn karaoke
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">用户: {userId}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                localStorage.removeItem("userId")
                setIsLoggedIn(false)
                setUserId("")
              }}
              className="text-gray-500 hover:text-gray-300"
            >
              退出
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 pb-24 overflow-hidden">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <Mic className="w-6 h-6" />
              {DEFAULT_SONG.title}
            </h2>
            <p className="text-gray-400">{DEFAULT_SONG.artist}</p>
          </div>
          {/* 等待 localStorage 加载完成后再渲染 ChainRecorder */}
          {/* 仅对 lianxunwang 显示合唱预览 */}
          {!isLoading &&
            userId === "lianxunwang" &&
            DEFAULT_SONG.finalMixUrl && (
              <CircleKaraoke originalUrl={DEFAULT_SONG.finalMixUrl} />
            )}
          {!isLoading && <ChainRecorder song={DEFAULT_SONG} userId={userId} />}
        </div>
      </main>
    </div>
  )
}
