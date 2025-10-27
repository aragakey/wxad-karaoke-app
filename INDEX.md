# 合唱 Karaoke 应用 - 项目索引

## 📚 文档导航

### 快速开始
- **[QUICKSTART.md](./QUICKSTART.md)** - 5 分钟快速启动指南 ⭐ 从这里开始
- **[start.sh](./start.sh)** - 一键启动脚本

### 详细文档
- **[README.md](./README.md)** - 完整项目文档和功能说明
- **[SETUP.md](./SETUP.md)** - 详细的设置和配置指南
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - 项目架构和技术总结
- **[CHECKLIST.md](./CHECKLIST.md)** - 项目完成清单

### 配置文件
- **[.env.example](./.env.example)** - 环境变量模板
- **[.env.local](./.env.local)** - 本地环境变量（开发用）
- **[docker-compose.yml](./docker-compose.yml)** - Docker 数据库配置

---

## 🚀 快速命令

### 启动应用
```bash
# 方式 1: 使用启动脚本（推荐）
./start.sh

# 方式 2: 手动启动
docker-compose up -d
npx prisma migrate dev --name init
npm run dev
```

### 开发命令
```bash
npm run dev      # 启动开发服务器
npm run build    # 构建项目
npm start        # 启动生产服务器
npm run lint     # 运行 ESLint
```

### 数据库命令
```bash
npx prisma studio              # 打开 Prisma Studio
npx prisma migrate dev         # 创建新迁移
npx prisma migrate reset       # 重置数据库
docker-compose up -d           # 启动 PostgreSQL
docker-compose down            # 停止 PostgreSQL
```

---

## 📁 项目结构

```
wxad-karaoke-app/
├── src/
│   ├── app/
│   │   ├── api/                    # API 路由
│   │   │   ├── songs/              # 歌曲管理
│   │   │   └── recordings/         # 录音管理
│   │   ├── layout.tsx              # 根布局
│   │   ├── page.tsx                # 主页面
│   │   └── globals.css             # 全局样式
│   ├── components/
│   │   ├── ui/                     # shadcn UI 组件
│   │   ├── SongList.tsx            # 歌曲列表
│   │   ├── SongRecorder.tsx        # 录音界面
│   │   └── CreateSongDialog.tsx    # 创建歌曲
│   └── lib/
│       └── utils.ts                # 工具函数
├── prisma/
│   └── schema.prisma               # 数据库 schema
├── public/
│   └── uploads/                    # 文件存储
├── 📄 README.md                    # 项目文档
├── 📄 SETUP.md                     # 设置指南
├── 📄 QUICKSTART.md                # 快速开始
├── 📄 PROJECT_SUMMARY.md           # 项目总结
├── 📄 CHECKLIST.md                 # 完成清单
├── 📄 INDEX.md                     # 本文件
├── 🐳 docker-compose.yml           # Docker 配置
├── 🔧 start.sh                     # 启动脚本
└── 📦 package.json                 # 项目依赖
```

---

## 🎯 核心功能

### 1. 用户管理
- 简单的用户 ID 登录
- 本地存储用户信息

### 2. 歌曲管理
- 创建新歌曲
- 上传伴奏文件
- 定义多个声部
- 删除歌曲

### 3. 录音功能
- 使用麦克风录音
- 播放伴奏进行练习
- 调节伴奏音量
- 预听录音
- 上传录音到服务器

### 4. 数据持久化
- PostgreSQL 数据库
- 记录用户演唱信息
- 保存音频文件

---

## 🛠️ 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Next.js | 16 |
| UI 库 | React | 19 |
| 样式 | Tailwind CSS | 4 |
| 组件库 | shadcn/ui | v1 |
| 数据库 | PostgreSQL | 16 |
| ORM | Prisma | 6.18 |
| 语言 | TypeScript | 5 |

---

## 📱 功能特性

- ✅ 多人合唱支持
- ✅ 完全移动端适配
- ✅ 实时音频录制
- ✅ 伴奏播放和音量控制
- ✅ 用户演唱记录
- ✅ 音频文件存储
- ✅ 响应式设计
- ✅ 现代化 UI

---

## 🔐 安全特性

- 环境变量管理
- 输入验证
- 文件上传限制
- CORS 配置
- 生产环境 HTTPS 支持

---

## 📊 数据库架构

### Song（歌曲）
- 存储歌曲基本信息
- 关联伴奏文件 URL
- 一对多关系到 Part

### Part（声部）
- 定义歌曲的不同声部
- 设置时间范围
- 一对多关系到 Recording

### Recording（录音）
- 存储用户录音信息
- 关联用户 ID
- 关联歌曲和声部

---

## 🚀 部署选项

### Vercel（推荐）
```bash
vercel
```

### Docker
```bash
docker build -t karaoke-app .
docker run -p 3000:3000 karaoke-app
```

### 传统服务器
```bash
npm run build
npm start
```

---

## 📖 学习资源

- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://react.dev)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [shadcn/ui 文档](https://ui.shadcn.com)
- [Prisma 文档](https://www.prisma.io/docs)
- [PostgreSQL 文档](https://www.postgresql.org/docs)

---

## ❓ 常见问题

### Q: 如何启动应用？
A: 查看 [QUICKSTART.md](./QUICKSTART.md)

### Q: 如何配置数据库？
A: 查看 [SETUP.md](./SETUP.md)

### Q: 如何部署到生产环境？
A: 查看 [README.md](./README.md) 的部署部分

### Q: 如何修改数据库 schema？
A: 查看 [SETUP.md](./SETUP.md) 的数据库操作部分

---

## 📞 支持

- 📖 查看文档
- 🐛 检查浏览器控制台错误
- 📋 查看 Docker 日志：`docker-compose logs`
- 🔍 查看 Prisma Studio：`npx prisma studio`

---

## 📝 版本信息

- **版本**: 0.1.0
- **状态**: ✅ 完成
- **最后更新**: 2025-10-27
- **许可证**: MIT

---

## 🎉 开始使用

1. 阅读 [QUICKSTART.md](./QUICKSTART.md)
2. 运行 `./start.sh` 或按照快速开始步骤
3. 访问 `http://localhost:3000`
4. 开始创建歌曲和录音！

**祝你使用愉快！🎤🎵**
