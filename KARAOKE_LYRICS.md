# 卡拉OK歌词系统

## 功能说明

该系统在用户录音时显示卡拉OK风格的歌词提示，帮助用户知道当前应该唱哪一句。

## 文件结构

### 1. `src/lib/lyrics.ts`
包含所有歌词数据和用户分配配置：
- `MONDAY_LYRICS`: 歌曲的所有歌词行，包含时间戳和歌词文本
- `USER_ASSIGNMENTS`: 用户与歌词行的映射关系
- 辅助函数：`getCurrentLyric()`, `getNextLyric()`, `getUserLyricRange()`

### 2. `src/components/KaraokeDisplay.tsx`
卡拉OK显示组件，显示：
- 当前应该唱的歌词（高亮显示）
- 下一句歌词预览
- 进度条动画
- 用户的歌词范围提示

### 3. `src/components/ChainRecorder.tsx`
集成卡拉OK显示到录音界面

## 配置用户歌词范围

在 `src/lib/lyrics.ts` 中修改 `USER_ASSIGNMENTS` 数组：

```typescript
export const USER_ASSIGNMENTS: UserLyricAssignment[] = [
  { userId: 'aragakey', startLineId: 1, endLineId: 6 },
  { userId: 'user2', startLineId: 7, endLineId: 12 },
  // 添加更多用户...
];
```

## 添加新歌词

1. 在 `MONDAY_LYRICS` 数组中添加新的歌词行：
```typescript
{ id: 62, time: 230.00, text: '新的歌词' },
```

2. 更新 `USER_ASSIGNMENTS` 中的 `endLineId`

## 歌词时间戳格式

时间戳以秒为单位，精确到小数点后两位。例如：
- `46.68` = 46秒68毫秒
- `50.98` = 50秒98毫秒

## 显示效果

- **当前歌词**: 大字体，黄色高亮，带有"现在轮到你唱！"提示
- **进度条**: 从左到右填充，显示当前歌词的进度
- **下一句预览**: 灰色小字体，显示下一句歌词
- **范围提示**: 显示用户应该唱的歌词行号范围
