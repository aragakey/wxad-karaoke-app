# 🎤 合唱 Karaoke 应用 - 开始使用

欢迎！这是一个完整的多人合唱 Web 应用。请按照以下步骤快速开始。

---

## ⚡ 5 分钟快速开始

### 1️⃣ 启动数据库
```bash
cd /Users/aragakey/Sites/wxad-karaoke-app
docker-compose up -d
```

### 2️⃣ 初始化数据库
```bash
npx prisma migrate dev --name init
```

### 3️⃣ 启动应用
```bash
npm run dev
```

### 4️⃣ 打开浏览器
访问 **http://localhost:3000**

---

## 📚 文档导航

| 文档 | 说明 | 何时阅读 |
|------|------|---------|
| **[QUICKSTART.md](./QUICKSTART.md)** | 快速开始指南 | 🔴 **首先阅读** |
| **[README.md](./README.md)** | 完整功能文档 | 了解所有功能 |
| **[SETUP.md](./SETUP.md)** | 详细设置指南 | 遇到问题时 |
| **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** | 技术架构 | 了解技术栈 |
| **[INDEX.md](./INDEX.md)** | 项目索引 | 查找内容 |
| **[DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md)** | 部署报告 | 准备部署时 |

---

## 🎯 使用流程

### 第一次使用

1. **登录**
   - 输入任意用户 ID（例如：user123）
   - 点击"进入"

2. **创建歌曲**
   - 点击"新建歌曲"
   - 填写歌曲信息
   - 上传伴奏文件（可使用 `/Users/aragakey/Sites/wxad-karaoke/monday-clip-伴奏.wav`）
   - 定义声部（高音、中音、低音等）
   - 点击"创建"

3. **录音**
   - 从歌曲列表选择歌曲
   - 切换到"录音"标签页
   - 选择声部
   - 点击"播放伴奏"进行练习
   - 点击"开始录音"
   - 唱歌...
   - 点击"停止录音"
   - 点击"上传"保存

---

## 🛠️ 常用命令

```bash
# 启动应用
npm run dev

# 构建项目
npm run build

# 启动生产服务器
npm start

# 打开数据库管理界面
npx prisma studio

# 查看数据库日志
docker-compose logs postgres

# 停止数据库
docker-compose down

# 重置数据库（删除所有数据）
npx prisma migrate reset
```

---

## 📱 功能特性

✅ **多人合唱** - 支持多个声部
✅ **音频录制** - 使用浏览器麦克风
✅ **伴奏播放** - 支持音量调节
✅ **移动端** - 完全响应式设计
✅ **数据存储** - PostgreSQL 数据库
✅ **文件上传** - 自动保存音频

---

## 🔧 技术栈

- **前端**: Next.js 16 + React 19 + Tailwind CSS
- **UI**: shadcn/ui 组件库
- **后端**: Next.js API Routes
- **数据库**: PostgreSQL + Prisma ORM
- **音频**: Web Audio API

---

## ❓ 常见问题

### Q: 麦克风无法工作？
A: 检查浏览器权限，允许访问麦克风

### Q: 如何停止应用？
A: 按 `Ctrl+C` 停止开发服务器

### Q: 如何查看数据库数据？
A: 运行 `npx prisma studio`

### Q: 如何重置所有数据？
A: 运行 `npx prisma migrate reset`

### Q: 如何部署到生产环境？
A: 查看 [DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md)

---

## 📊 项目统计

- **代码行数**: ~1,200 行 TypeScript/React
- **文档**: 7 个详细文档文件
- **依赖**: 19 个 npm 包
- **API 端点**: 5 个
- **数据库表**: 3 个

---

## 🚀 下一步

1. ✅ 启动应用（按照上面的 5 分钟快速开始）
2. 📖 阅读 [QUICKSTART.md](./QUICKSTART.md)
3. 🎵 创建第一首歌曲
4. 🎤 录制第一段音频
5. 📚 查看 [README.md](./README.md) 了解更多功能

---

## 💡 提示

- 使用 `./start.sh` 脚本可以一键启动所有服务
- 所有文件都保存在 `public/uploads/` 目录
- 用户信息保存在浏览器本地存储
- 可以在 Prisma Studio 中查看和编辑数据库

---

## 📞 需要帮助？

1. 查看 [SETUP.md](./SETUP.md) 的常见问题部分
2. 检查浏览器控制台错误信息
3. 查看 Docker 日志：`docker-compose logs`
4. 查看应用日志：`npm run dev` 的输出

---

## 🎉 准备好了吗？

**现在就开始吧！** 按照上面的 5 分钟快速开始步骤，你将在几分钟内拥有一个完整的合唱应用。

**祝你使用愉快！🎤🎵**

---

**项目版本**: 0.1.0
**最后更新**: 2025-10-27
**许可证**: MIT
