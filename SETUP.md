# 项目设置指南

## 快速开始（开发模式）

### 1. 启动 PostgreSQL 数据库

使用 Docker Compose 启动数据库：

```bash
docker-compose up -d
```

这会启动一个 PostgreSQL 容器，连接信息：
- Host: localhost
- Port: 5432
- User: karaoke_user
- Password: karaoke_password
- Database: karaoke

### 2. 配置环境变量

复制 `.env.example` 到 `.env.local`：

```bash
cp .env.example .env.local
```

确保 `.env.local` 中的数据库 URL 正确：
```
DATABASE_URL="postgresql://karaoke_user:karaoke_password@localhost:5432/karaoke"
```

### 3. 初始化数据库

运行 Prisma 迁移：

```bash
npx prisma migrate dev --name init
```

这会创建所有必要的数据库表。

### 4. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000`

## 项目结构说明

```
wxad-karaoke-app/
├── src/
│   ├── app/
│   │   ├── api/              # API 路由
│   │   │   ├── songs/        # 歌曲管理 API
│   │   │   └── recordings/   # 录音管理 API
│   │   ├── layout.tsx        # 根布局
│   │   ├── page.tsx          # 主页面
│   │   └── globals.css       # 全局样式
│   ├── components/
│   │   ├── ui/               # shadcn UI 组件
│   │   ├── SongList.tsx      # 歌曲列表
│   │   ├── SongRecorder.tsx  # 录音界面
│   │   └── CreateSongDialog.tsx # 创建歌曲对话框
│   └── lib/
│       └── utils.ts          # 工具函数
├── prisma/
│   └── schema.prisma         # 数据库 schema
├── public/
│   └── uploads/              # 上传的文件存储
├── docker-compose.yml        # Docker 配置
├── .env.local                # 环境变量（本地）
└── package.json              # 项目依赖
```

## 功能说明

### 登录
- 输入用户 ID 进入应用
- 用户 ID 保存在浏览器本地存储中

### 创建歌曲
1. 点击"新建歌曲"按钮
2. 填写歌曲信息：
   - 歌曲名称
   - 艺术家
   - 时长（秒）
   - 伴奏文件（音频文件）
3. 定义声部：
   - 声部名称（如：高音、中音、低音）
   - 开始时间（秒）
   - 结束时间（秒）
4. 点击"创建"

### 录音
1. 从歌曲列表选择一首歌曲
2. 切换到"录音"标签页
3. 选择要演唱的声部
4. 点击"播放伴奏"进行练习（可调节音量）
5. 点击"开始录音"开始录制
6. 点击"停止录音"结束录制
7. 可以点击"播放"预听录音
8. 点击"上传"保存录音到服务器

## 数据库操作

### 查看数据库

使用 Prisma Studio：

```bash
npx prisma studio
```

这会打开一个 Web 界面，可以查看和编辑数据库中的数据。

### 重置数据库

```bash
npx prisma migrate reset
```

**警告**：这会删除所有数据！

## 文件上传

- **伴奏文件**：保存在 `public/uploads/backing-tracks/`
- **录音文件**：保存在 `public/uploads/recordings/`

这些目录会在首次上传时自动创建。

## 生产部署

### 构建项目

```bash
npm run build
```

### 启动生产服务器

```bash
npm start
```

### 环境变量（生产）

创建 `.env.production` 文件：

```env
DATABASE_URL="postgresql://user:password@prod-host:5432/karaoke"
NEXT_PUBLIC_API_URL="https://your-domain.com"
NODE_ENV=production
```

## 常见问题

### Q: 无法连接到数据库
A: 确保 PostgreSQL 容器正在运行：
```bash
docker-compose ps
```

### Q: 麦克风无法访问
A: 
- 检查浏览器权限设置
- 确保使用 HTTPS（生产环境）或 localhost（开发环境）
- 某些浏览器可能需要用户手动授予权限

### Q: 上传的文件找不到
A: 确保 `public/uploads/` 目录存在且有写入权限

### Q: 如何修改数据库 schema
A: 
1. 编辑 `prisma/schema.prisma`
2. 运行 `npx prisma migrate dev --name <migration-name>`
3. 根据提示确认更改

## 开发工具

### Prisma CLI

```bash
# 生成 Prisma Client
npx prisma generate

# 查看数据库状态
npx prisma db push

# 创建新迁移
npx prisma migrate dev --name <name>

# 打开 Prisma Studio
npx prisma studio
```

### Next.js CLI

```bash
# 启动开发服务器
npm run dev

# 构建项目
npm run build

# 启动生产服务器
npm start

# 运行 ESLint
npm run lint
```

## 性能优化建议

1. **图片优化**：使用 Next.js Image 组件
2. **代码分割**：使用动态导入
3. **缓存**：配置 HTTP 缓存头
4. **数据库**：添加适当的索引
5. **CDN**：部署到 CDN 加速静态资源

## 安全建议

1. **环境变量**：不要提交 `.env.local` 到版本控制
2. **认证**：集成真实的用户认证系统
3. **验证**：验证所有用户输入
4. **HTTPS**：生产环境必须使用 HTTPS
5. **CORS**：配置适当的 CORS 策略

## 获取帮助

- Next.js 文档：https://nextjs.org/docs
- Prisma 文档：https://www.prisma.io/docs
- shadcn/ui 文档：https://ui.shadcn.com
- PostgreSQL 文档：https://www.postgresql.org/docs
