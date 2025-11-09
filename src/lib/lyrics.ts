export interface LyricLine {
  id: number;
  time: number; // 秒数
  text: string;
}

export const MONDAY_LYRICS: LyricLine[] = [
  { id: 1, time: 46.68, text: '刚刚我站在路口' },
  { id: 2, time: 50.98, text: '空气里的快乐因子很多' },
  { id: 3, time: 57.81, text: '听着mp3' },
  { id: 4, time: 59.25, text: '播范特西' },
  { id: 5, time: 60.66, text: '我又想到你' },
  { id: 6, time: 62.95, text: '想到你無法抗拒 stuck in my dreaming baby' },
  { id: 7, time: 68.51, text: '金色的天空' },
  { id: 8, time: 71.20, text: '云朵片片划过' },
  { id: 9, time: 73.85, text: '好像心里头' },
  { id: 10, time: 76.32, text: '是一样' },
  { id: 11, time: 77.39, text: '如果说' },
  { id: 12, time: 78.28, text: '风和雨化做是你' },
  { id: 13, time: 82.56, text: '我愿' },
  { id: 14, time: 83.88, text: '化成' },
  { id: 15, time: 85.15, text: '大地' },
  { id: 16, time: 86.13, text: '在一起' },
  { id: 17, time: 88.81, text: 'Monday' },
  { id: 18, time: 90.12, text: '和你走到Sunday' },
  { id: 19, time: 92.54, text: '坐最后一班电车' },
  { id: 20, time: 96.56, text: '和你看日落' },
  { id: 21, time: 98.35, text: '我们去喝橘子汽水' },
  { id: 22, time: 101.10, text: '我想和你浪漫约会' },
  { id: 23, time: 130.54, text: '不需要去说太多' },
  { id: 24, time: 134.39, text: '此刻这一分钟' },
  { id: 25, time: 136.65, text: '心还在跳动' },
  { id: 26, time: 141.25, text: '听着声音' },
  { id: 27, time: 142.51, text: '画着这旋律' },
  { id: 28, time: 143.87, text: '脑海里都是你' },
  { id: 29, time: 146.47, text: '一個 sunny day 嗰場景好電影' },
  { id: 30, time: 148.89, text: '喺山路駛著跑車 畫面全部八毫米' },
  { id: 31, time: 151.96, text: '海边的晚风' },
  { id: 32, time: 154.56, text: '有你的温柔' },
  { id: 33, time: 157.23, text: '好像心里头' },
  { id: 34, time: 159.78, text: '是一样' },
  { id: 35, time: 160.89, text: '如果说' },
  { id: 36, time: 161.82, text: '太平洋化成是你' },
  { id: 37, time: 166.05, text: '我愿' },
  { id: 38, time: 167.28, text: '化成' },
  { id: 39, time: 168.68, text: '微风' },
  { id: 40, time: 169.59, text: '陪伴你' },
  { id: 41, time: 171.47, text: 'rap：' },
  { id: 42, time: 173.29, text: '我哋第一次見面' },
  { id: 43, time: 175.95, text: '我份人不嬲都靦腆' },
  { id: 44, time: 178.22, text: '你問我點解要戴頭盔' },
  { id: 45, time: 180.10, text: '可能我喺 Super Mario 住喺臨街' },
  { id: 46, time: 183.67, text: '總之唔會喺你真命天子' },
  { id: 47, time: 186.28, text: '邊有咁好嘅事' },
  { id: 48, time: 188.92, text: '孫悟空都冇我咁曳' },
  { id: 49, time: 190.91, text: '嚟到花花世界 我都唔知點解' },
  { id: 50, time: 194.13, text: '揸車兜兜轉轉' },
  { id: 51, time: 196.64, text: '同你又嚟到海邊' },
  { id: 52, time: 199.20, text: '帶你睇日落城市' },
  { id: 53, time: 200.97, text: '山頂啲夜景好似霓虹燈閃' },
  { id: 54, time: 204.46, text: '好高興初次見面' },
  { id: 55, time: 206.96, text: '遇到你時光倒轉' },
  { id: 56, time: 213.96, text: 'Monday' },
  { id: 57, time: 215.20, text: '和你走到Sunday' },
  { id: 58, time: 217.70, text: '坐最后一班电车' },
  { id: 59, time: 220.47, text: '和你看日落' },
  { id: 60, time: 223.47, text: '我们去喝橘子汽水' },
  { id: 61, time: 226.27, text: '我要和你浪漫约会' },
];

// 用户分配配置
export interface LyricSegment {
  startLineId: number;
  endLineId: number;
}

export interface UserLyricAssignment {
  userId: string;
  nickname: string;
  avatar: string;
  password: string; // 密码是另一个人的名字
  segments: LyricSegment[];
}

export const commonSegments: LyricSegment[] = [
  { startLineId: 56, endLineId: 61 },    // 第二部分：最后 6 句
];

export const USER_ASSIGNMENTS: UserLyricAssignment[] = [
  {
    userId: 'kelsonluo',
    nickname: "kelson",
    avatar: "https://wxa.wxs.qq.com/wxad-design/yijie/kelson-avatar.png",
    password: 'dindinding',
    segments: [
      { startLineId: 1, endLineId: 2 },
      ...commonSegments,
    ]
  },
  {
    userId: 'dindinding',
    nickname: "din",
    avatar: "https://wxa.wxs.qq.com/wxad-design/yijie/din-avatar.png",
    password: 'eugenecao',
    segments: [
      { startLineId: 3, endLineId: 6 },
      ...commonSegments,
    ]
  },
  {
    userId: 'eugenecao',
    nickname: "che",
    avatar: "https://wxa.wxs.qq.com/wxad-design/yijie/che-ava.JPG",
    password: 'yitaohou',
    segments: [
      { startLineId: 7, endLineId: 10 },
      ...commonSegments,
    ]
  },
  {
    userId: 'yitaohou',
    nickname: "tao",
    avatar: "https://wxa.wxs.qq.com/wxad-design/yijie/tao-avatar.JPG",
    password: 'emmazjxwang',
    segments: [
      { startLineId: 11, endLineId: 16 },
      ...commonSegments,
    ]
  },
  {
    userId: 'emmazjxwang',
    nickname: "jixin",
    avatar: "https://wxa.wxs.qq.com/wxad-design/yijie/jixin-avatar.JPG",
    password: 'czshi',
    segments: [
      { startLineId: 17, endLineId: 20 },
      ...commonSegments,
    ]
  },
  {
    userId: 'czshi',
    nickname: "cz",
    avatar: "https://wxa.wxs.qq.com/wxad-design/yijie/cz-avatar.png",
    password: 'jihaoxie',
    segments: [
      { startLineId: 21, endLineId: 22 },
      ...commonSegments,
    ]
  },
  {
    userId: 'jihaoxie',
    nickname: "jihao",
    avatar: "https://wxa.wxs.qq.com/wxad-design/yijie/jihao-avatar.png",
    password: 'yijiejiang',
    segments: [
      { startLineId: 23, endLineId: 25 },
      ...commonSegments,
    ]
  },
  {
    userId: 'yijiejiang',
    nickname: "yijie",
    avatar: "https://wxa.wxs.qq.com/wxad-design/yijie/gakey-avatar.JPG",
    password: 'hsinuuzhang',
    segments: [
      { startLineId: 26, endLineId: 28 },
      ...commonSegments,
    ]
  },
  {
    userId: 'hsinuuzhang',
    avatar: "https://wxa.wxs.qq.com/wxad-design/yijie/hsinuu-avatar.JPG",
    nickname: "xinyu",
    password: 'iveszheng',
    segments: [
      { startLineId: 29, endLineId: 30 },
      ...commonSegments,
    ]
  },
  {
    userId: 'iveszheng',
    nickname: "ziyue",
    avatar: "https://wxa.wxs.qq.com/wxad-design/yijie/ziyue-avatar.JPG",
    password: 'lianxunwang',
    segments: [
      { startLineId: 31, endLineId: 34 },
      ...commonSegments,
    ]
  },
  {
    userId: 'lianxunwang',
    nickname: "lianxun",
    avatar: "https://wxa.wxs.qq.com/wxad-design/yijie/lianxun-avatar.JPG",
    password: 'tooyangliu',
    segments: [
      { startLineId: 35, endLineId: 40 },
      ...commonSegments,
    ]
  },
  {
    userId: 'tooyangliu',
    nickname: "yang",
    avatar: "https://wxa.wxs.qq.com/wxad-design/yijie/yang-ava.JPG",
    password: 'renqiangxie',
    segments: [
      { startLineId: 42, endLineId: 45 },
      ...commonSegments,
    ]
  },
  {
    userId: 'renqiangxie',
    nickname: "renqiang",
    avatar: "https://wxa.wxs.qq.com/wxad-design/yijie/renqiang-avatar.JPG",
    password: 'zakhongyang',
    segments: [
      { startLineId: 46, endLineId: 49 },
      ...commonSegments,
    ]
  },
  {
    userId: 'zakhongyang',
    nickname: "zehang",
    avatar: "https://wxa.wxs.qq.com/wxad-design/yijie/zehang-avatar.JPG",
    password: 'kelsonluo',
    segments: [
      { startLineId: 50, endLineId: 55 },
      ...commonSegments,
    ]
  }
];

export function getUserLyricSegments(userId: string) {
  const assignment = USER_ASSIGNMENTS.find(a => a.userId === userId);
  return assignment?.segments || [];
}

export function getLyricsByRange(startId: number, endId: number) {
  return MONDAY_LYRICS.filter(line => line.id >= startId && line.id <= endId);
}

export function getCurrentLyric(currentTime: number): LyricLine | null {
  // 找到当前时间应该显示的歌词
  let currentLyric = null;
  for (const lyric of MONDAY_LYRICS) {
    if (lyric.time <= currentTime) {
      currentLyric = lyric;
    } else {
      break;
    }
  }
  return currentLyric;
}

export function getNextLyric(currentTime: number): LyricLine | null {
  // 找到下一句歌词
  for (const lyric of MONDAY_LYRICS) {
    if (lyric.time > currentTime) {
      return lyric;
    }
  }
  return null;
}

export function getTimeRangeByLineIds(startLineId: number, endLineId: number) {
  const startLine = MONDAY_LYRICS.find(l => l.id === startLineId);
  const endLine = MONDAY_LYRICS.find(l => l.id === endLineId);

  if (!startLine || !endLine) {
    return { startTime: 0, endTime: 20 };
  }

  return {
    startTime: startLine.time - 5,  // 录音前空余 5 秒
    endTime: endLine.time + 10,     // 录音后空余 10 秒（确保完整录制长句子）
  };
}
