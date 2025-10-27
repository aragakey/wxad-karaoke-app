# 快速开始指南

## 5 分钟快速启动

### 前置要求
- Node.js 18+
- Docker 和 Docker Compose
- 现代浏览器

### 步骤 1: 启动数据库

```bash
cd /Users/aragakey/Sites/wxad-karaoke-app
docker-compose up -d
```

### 步骤 2: 初始化数据库

```bash
npx prisma migrate dev --name init
```

### 步骤 3: 启动开发服务器

```bash
npm run dev
```

### 步骤 4: 打开浏览器

访问 `http://localhost:3000`

---

## 使用应用

### 1. 登录
输入任意用户 ID（例如：user123）并点击"进入"

### 2. 创建歌曲
1. 点击"新建歌曲"按钮
2. 填写歌曲信息：
   - 歌曲名称：例如 "Happy Birthday"
   - 艺术家：例如 "Various Artists"
   - 时长：例如 180（秒）
   - 伴奏文件：选择 `/Users/aragakey/Sites/wxad-karaoke/monday-clip-伴奏.wav`
3. 定义声部（至少 2 个）：
   - 声部 1: 高音 (0-180)
   - 声部 2: 低音 (0-180)
4. 点击"创建"

### 3. 录音
1. 从歌曲列表选择刚创建的歌曲
2. 切换到"录音"标签页
3. 选择一个声部
4. 点击"播放伴奏"进行练习
5. 点击"开始录音"
6. 唱歌...
7. 点击"停止录音"
8. 点击"上传"保存录音

---

## 常见问题

### Q: 如何停止应用？
A: 按 `Ctrl+C` 停止开发服务器

### Q: 如何停止数据库？
A: 
```bash
docker-compose down
```

### Q: 如何查看数据库数据？
A:
```bash
npx prisma studio
```

### Q: 麦克风无法工作？
A: 
- 检查浏览器权限
- 确保允许访问麦克风
- 尝试使用 HTTPS（生产环境）

### Q: 如何重置所有数据？
A:
```bash
npx prisma migrate reset
```

---

## 项目文件说明

| 文件 | 说明 |
|------|------|
| `README.md` | 完整项目文档 |
| `SETUP.md` | 详细设置指南 |
| `PROJECT_SUMMARY.md` | 项目总结和架构 |
| `start.sh` | 一键启动脚本 |
| `docker-compose.yml` | Docker 配置 |
| `.env.local` | 本地环境变量 |
| `.env.example` | 环境变量模板 |

---

## 下一步

- 阅读 `README.md` 了解完整功能
- 查看 `SETUP.md` 了解详细配置
- 查看 `PROJECT_SUMMARY.md` 了解技术架构

---

## 需要帮助？

1. 检查 `SETUP.md` 中的常见问题
2. 查看浏览器控制台错误信息
3. 检查 Docker 容器日志：`docker-compose logs postgres`

---

**祝你使用愉快！🎤🎵**
