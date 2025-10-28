# 合唱 Karaoke 应用

一个多人一起合唱歌曲的 Web 应用，支持移动端。

## 功能特性

- 🎤 **多人合唱** - 支持多个声部（高音、中音、低音等）
- 🎵 **伴奏播放** - 播放伴奏文件，支持音量调节
- 🎙️ **录音功能** - 使用浏览器麦克风录制演唱
- 📱 **移动端适配** - 完全响应式设计，支持手机和平板
- 💾 **音频存储** - 自动保存用户录音
- 📊 **演唱记录** - 后台记录每个用户的演唱信息

## 技术栈

- **前端框架**: Next.js 16 + React 19
- **UI 组件**: shadcn/ui
- **样式**: Tailwind CSS
- **数据库**: PostgreSQL + Prisma ORM
- **音频处理**: Web Audio API
- **部署**: 支持 Vercel、Docker 等

## 快速开始

### 前置要求

- Node.js 18+
- PostgreSQL 12+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
cd /Users/aragakey/Sites/wxad-karaoke-app
```

2. **安装依赖**
```bash
npm install
```

3. **配置数据库**

编辑 `.env.local` 文件，配置 PostgreSQL 连接：
```env
DATABASE_URL="postgresql://user:password@localhost:5432/karaoke"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

4. **初始化数据库**
```bash
npx prisma migrate dev --name init
```

5. **启动开发服务器**
```bash
npm run dev
```

访问 `http://localhost:3000`

## 使用指南

### 1. 登录
- 输入用户 ID 进入应用
- 用户 ID 会保存在本地存储中

### 2. 创建歌曲
- 点击"新建歌曲"按钮
- 填写歌曲信息（名称、艺术家、时长）
- 上传伴奏文件
- 定义声部（名称、开始时间、结束时间）
- 点击"创建"

### 3. 录音
- 从歌曲列表选择一首歌曲
- 切换到"录音"标签页
- 选择要演唱的声部
- 点击"播放伴奏"进行练习
- 点击"开始录音"开始录制
- 点击"停止录音"结束录制
- 点击"上传"保存录音

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── songs/          # 歌曲 API
│   │   └── recordings/     # 录音 API
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 主页面
│   └── globals.css         # 全局样式
├── components/
│   ├── SongList.tsx        # 歌曲列表组件
│   ├── SongRecorder.tsx    # 录音组件
│   └── CreateSongDialog.tsx # 创建歌曲对话框
└── lib/
    └── utils.ts            # 工具函数

prisma/
└── schema.prisma           # 数据库 schema
```

## 数据库 Schema

### Song（歌曲）
- id: 唯一标识
- title: 歌曲名称
- artist: 艺术家
- duration: 时长（秒）
- backingTrackUrl: 伴奏文件 URL
- parts: 声部列表

### Part（声部）
- id: 唯一标识
- songId: 所属歌曲
- name: 声部名称
- startTime: 开始时间（秒）
- endTime: 结束时间（秒）
- order: 声部顺序

### Recording（录音）
- id: 唯一标识
- songId: 所属歌曲
- partId: 所属声部
- userId: 用户 ID
- audioUrl: 音频文件 URL
- duration: 录音时长（秒）
- createdAt: 创建时间

## API 端点

### 歌曲管理
- `GET /api/songs` - 获取所有歌曲
- `POST /api/songs` - 创建新歌曲
- `DELETE /api/songs/[id]` - 删除歌曲

### 录音管理
- `GET /api/recordings` - 获取录音列表
- `POST /api/recordings` - 上传新录音

## 移动端适配

应用完全支持移动端：
- 响应式布局
- 触摸友好的按钮和控件
- 优化的音频控制
- 适配各种屏幕尺寸

## 后续优化方向

- [ ] 用户认证系统集成
- [ ] 实时多人合唱混音
- [ ] 歌曲评分和反馈
- [ ] 合唱视频导出
- [ ] 社交分享功能
- [ ] 歌曲推荐算法
- [ ] 离线模式支持

## 部署

### Vercel 部署
```bash
npm install -g vercel
vercel
```

### Docker 部署
```bash
docker build -t karaoke-app .
docker run -p 3000:3000 karaoke-app
```

## 许可证

MIT

## 支持

如有问题或建议，请提交 Issue 或 Pull Request。
# Trigger rebuild
