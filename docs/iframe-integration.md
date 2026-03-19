# Karaoke iframe 集成文档

通过 `postMessage` 获取 Karaoke iframe 的实时播放状态，或从外层控制播放。

## 嵌入 iframe

```html
<iframe id="karaoke" src="https://your-karaoke-domain.com"></iframe>
```

---

## 接收播放状态（iframe → 父窗口）

所有消息的 `source` 字段固定为 `"karaoke"`，通过 `event.data.type` 区分事件类型。

```javascript
window.addEventListener("message", (event) => {
  if (event.data?.source !== "karaoke") return;
  // event.data.type — 事件类型
});
```

### `ready`

音频加载完成时触发。

```typescript
{
  source: "karaoke",
  type: "ready",
  duration: number  // 音频总时长（秒）
}
```

### `timeupdate`

播放过程中持续触发（约每 500ms，歌词切换时立即触发）。

```typescript
{
  source: "karaoke",
  type: "timeupdate",
  currentTime: number,   // 当前播放时间（秒）
  duration: number,      // 总时长（秒）
  isPlaying: boolean,    // 是否正在播放
  progress: number,      // 播放进度 0~1
  lyric: {               // 当前歌词，可能为 null
    id: number,
    time: number,
    text: string
  } | null,
  singers: Array<{       // 当前演唱者（合唱时有多人）
    userId: string,
    nickname: string,
    avatar: string
  }>
}
```

### `play`

用户点击播放时触发。

```typescript
{ source: "karaoke", type: "play", currentTime: number }
```

### `pause`

用户点击暂停时触发。

```typescript
{ source: "karaoke", type: "pause", currentTime: number }
```

### `ended`

播放结束时触发。

```typescript
{ source: "karaoke", type: "ended" }
```

---

## 控制播放（父窗口 → iframe）

所有指令的 `source` 字段必须为 `"karaoke-host"`。

```javascript
const iframe = document.getElementById("karaoke");

// 播放
iframe.contentWindow.postMessage({ source: "karaoke-host", type: "play" }, "*");

// 暂停
iframe.contentWindow.postMessage({ source: "karaoke-host", type: "pause" }, "*");

// 切换播放/暂停
iframe.contentWindow.postMessage({ source: "karaoke-host", type: "toggle" }, "*");

// 跳转到指定时间（秒）
iframe.contentWindow.postMessage({ source: "karaoke-host", type: "seek", time: 30 }, "*");
```

---

## 注意事项

- **跨域**：`postMessage` 使用 `"*"` 作为 targetOrigin，已开放最大权限。生产环境建议改为指定域名。
- **iframe 嵌入**：服务端已配置 `Content-Security-Policy: frame-ancestors *`，允许任何域名嵌入。
- **消息频率**：`timeupdate` 经过节流，不会造成性能问题。
