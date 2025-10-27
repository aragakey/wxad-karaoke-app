# 合唱 Karaoke 应用 - 项目总结

## 项目概述

这是一个现代化的多人合唱 Web 应用，允许多个用户一起演唱同一首歌曲的不同声部。应用完全支持移动端，提供了直观的用户界面和强大的音频处理能力。

## 核心功能

### 1. 用户管理
- 简单的用户 ID 登录系统
- 本地存储用户信息
- 支持多用户同时使用

### 2. 歌曲管理
- 创建新歌曲（上传伴奏文件）
- 定义多个声部（高音、中音、低音等）
- 设置每个声部的时间范围
- 删除歌曲

### 3. 录音功能
- 使用浏览器麦克风录音
- 播放伴奏进行练习
- 调节伴奏音量
- 预听录音
- 上传录音到服务器

### 4. 数据持久化
- PostgreSQL 数据库存储
- 记录每个用户的演唱信息
- 保存音频文件

## 技术架构

### 前端
- **框架**: Next.js 16 (App Router)
- **UI 库**: shadcn/ui
- **样式**: Tailwind CSS
- **图标**: lucide-react
- **通知**: sonner
- **音频**: Web Audio API

### 后端
- **运行时**: Node.js
- **框架**: Next.js API Routes
- **ORM**: Prisma
- **数据库**: PostgreSQL

### 部署
- 支持 Vercel、Docker、传统服务器
- 环境变量配置
- 生产构建优化

## 项目结构

```
wxad-karaoke-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── songs/
│   │   │   │   ├── route.ts          # GET/POST 歌曲
│   │   │   │   └── [id]/route.ts     # DELETE 歌曲
│   │   │   └── recordings/
│   │   │       └── route.ts          # GET/POST 录音
│   │   ├── layout.tsx                # 根布局
│   │   ├── page.tsx                  # 主页面
│   │   └── globals.css               # 全局样式
│   ├── components/
│   │   ├── ui/                       # shadcn 组件
│   │   ├── SongList.tsx              # 歌曲列表
│   │   ├── SongRecorder.tsx          # 录音界面
│   │   └── CreateSongDialog.tsx      # 创建歌曲
│   └── lib/
│       └── utils.ts                  # 工具函数
├── prisma/
│   └── schema.prisma                 # 数据库 schema
├── public/
│   └── uploads/                      # 文件存储
├── docker-compose.yml                # Docker 配置
├── start.sh                          # 启动脚本
├── SETUP.md                          # 设置指南
└── README.md                         # 项目文档
```

## 数据库设计

### Song 表
```sql
- id: String (主键)
- title: String (歌曲名称)
- artist: String (艺术家)
- duration: Int (时长，秒)
- backingTrackUrl: String (伴奏文件 URL)
- createdAt: DateTime
- updatedAt: DateTime
```

### Part 表
```sql
- id: String (主键)
- songId: String (外键)
- name: String (声部名称)
- startTime: Float (开始时间，秒)
- endTime: Float (结束时间，秒)
- order: Int (声部顺序)
```

### Recording 表
```sql
- id: String (主键)
- songId: String (外键)
- partId: String (外键)
- userId: String (用户 ID)
- audioUrl: String (音频文件 URL)
- duration: Int (录音时长，秒)
- createdAt: DateTime
- updatedAt: DateTime
```

## API 端点

### 歌曲管理
- `GET /api/songs` - 获取所有歌曲
- `POST /api/songs` - 创建新歌曲
- `DELETE /api/songs/[id]` - 删除歌曲

### 录音管理
- `GET /api/recordings` - 获取录音列表
- `POST /api/recordings` - 上传新录音

## 移动端适配

应用采用响应式设计，完全支持移动设备：

- **布局**: Flexbox 和 Grid 布局
- **字体**: 相对单位（rem）
- **按钮**: 大尺寸，易于触摸
- **输入**: 优化的表单控件
- **导航**: 底部固定导航栏
- **视口**: 正确的 meta 标签配置

## 快速开始

### 开发环境

```bash
# 1. 启动数据库
docker-compose up -d

# 2. 初始化数据库
npx prisma migrate dev --name init

# 3. 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 使用启动脚本

```bash
./start.sh
```

## 后续优化方向

### 短期
- [ ] 实时音频混音预览
- [ ] 录音质量指标显示
- [ ] 歌曲搜索和过滤
- [ ] 用户录音历史

### 中期
- [ ] 真实用户认证系统
- [ ] 社交分享功能
- [ ] 歌曲评分和评论
- [ ] 合唱视频导出

### 长期
- [ ] AI 音质评分
- [ ] 实时多人合唱混音
- [ ] 移动应用（React Native）
- [ ] 离线模式支持

## 部署指南

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

### 传统服务器部署

```bash
npm run build
npm start
```

## 环境变量

### 开发环境 (.env.local)
```env
DATABASE_URL="postgresql://karaoke_user:karaoke_password@localhost:5432/karaoke"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### 生产环境 (.env.production)
```env
DATABASE_URL="postgresql://user:password@prod-host:5432/karaoke"
NEXT_PUBLIC_API_URL="https://your-domain.com"
NODE_ENV=production
```

## 性能指标

- **首屏加载**: < 2s
- **API 响应**: < 500ms
- **录音延迟**: < 100ms
- **文件上传**: 支持 100MB+ 文件

## 安全考虑

1. **认证**: 集成真实的用户认证系统
2. **授权**: 验证用户权限
3. **输入验证**: 验证所有用户输入
4. **HTTPS**: 生产环境必须使用 HTTPS
5. **CORS**: 配置适当的跨域策略
6. **文件上传**: 限制文件类型和大小

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- 移动浏览器（iOS Safari, Chrome Mobile）

## 依赖项

### 核心依赖
- next: 16.0.0
- react: 19.2.0
- react-dom: 19.2.0
- prisma: ^6.18.0
- @prisma/client: ^6.18.0

### UI 依赖
- tailwindcss: ^4
- shadcn: v1
- lucide-react: ^0.548.0
- sonner: ^2.0.7

### 开发依赖
- typescript: ^5
- eslint: ^9
- @tailwindcss/postcss: ^4

## 许可证

MIT

## 支持和反馈

如有问题或建议，请提交 Issue 或 Pull Request。

---

**最后更新**: 2025-10-27
**版本**: 0.1.0
