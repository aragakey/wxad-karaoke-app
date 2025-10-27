# 卡拉OK应用发布指南

## 项目概述

这是一个 Next.js 卡拉OK应用，支持多人接龙录音。

**技术栈**:
- 前端: Next.js 16, React 19, TypeScript, Tailwind CSS
- 后端: Next.js API Routes
- 数据库: PostgreSQL (Prisma ORM)
- 存储: 本地文件系统 (生产建议迁移到 S3/OSS)

## 发布前准备

### 1. 环境变量配置

创建 `.env.production` 文件:

```env
# 数据库连接
DATABASE_URL="postgresql://user:password@host:5432/karaoke_db"

# API 地址
NEXT_PUBLIC_API_URL="https://your-domain.com"

# Node 环境
NODE_ENV=production
```

### 2. 数据库准备

```bash
# 安装依赖
npm install

# 生成 Prisma 客户端
npx prisma generate

# 运行迁移（首次部署）
npx prisma migrate deploy

# 或者创建新迁移
npx prisma migrate dev --name init
```

### 3. 本地构建测试

```bash
# 构建
npm run build

# 启动生产服务器
npm run start

# 访问 http://localhost:3000
```

## 部署选项

### 选项 A: Vercel (推荐)

最简单的 Next.js 部署方式。

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 部署
vercel

# 3. 配置环境变量
# 在 Vercel 控制面板设置 DATABASE_URL 等

# 4. 连接 GitHub (可选)
# 在 Vercel 控制面板连接 GitHub 仓库，实现自动部署
```

**注意**: Vercel 的无服务器函数有冷启动，文件上传需要配置。

### 选项 B: Railway

支持 PostgreSQL 和 Node.js 应用。

```bash
# 1. 在 railway.app 创建项目
# 2. 连接 GitHub 仓库
# 3. 添加 PostgreSQL 数据库
# 4. 设置环境变量
# 5. 自动部署
```

### 选项 C: 自托管 (VPS)

使用 Ubuntu 服务器 + PM2 + Nginx。

```bash
# 1. SSH 连接到服务器
ssh user@your-server.com

# 2. 安装 Node.js 和 PostgreSQL
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql postgresql-contrib

# 3. 克隆项目
git clone your-repo.git
cd wxad-karaoke-app

# 4. 安装依赖
npm install

# 5. 配置环境变量
nano .env.production

# 6. 构建
npm run build

# 7. 安装 PM2
npm install -g pm2

# 8. 启动应用
pm2 start npm --name "karaoke" -- start

# 9. 配置 Nginx 反向代理
sudo nano /etc/nginx/sites-available/default
```

Nginx 配置示例:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 文件上传限制
    client_max_body_size 100M;
}
```

## 生产环境优化

### 1. 文件存储迁移 (重要)

当前使用本地文件系统，生产环境建议迁移到云存储。

**迁移到 AWS S3**:

```bash
npm install aws-sdk
```

修改 API 路由使用 S3:

```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: "us-east-1" });

// 上传到 S3 而不是本地文件系统
const command = new PutObjectCommand({
  Bucket: "your-bucket",
  Key: filename,
  Body: buffer,
});

await s3.send(command);
```

### 2. 数据库备份

```bash
# 定期备份
pg_dump karaoke_db > backup_$(date +%Y%m%d).sql

# 恢复
psql karaoke_db < backup_20240101.sql
```

### 3. 监控和日志

添加 Sentry 错误监控:

```bash
npm install @sentry/nextjs
```

### 4. 性能优化

- 启用 gzip 压缩
- 配置 CDN
- 优化图片
- 代码分割

### 5. 安全加固

- [ ] 启用 HTTPS
- [ ] 配置 CORS
- [ ] 添加认证/授权
- [ ] 速率限制
- [ ] 输入验证
- [ ] SQL 注入防护 (Prisma 已防护)

## 故障排查

### 问题 1: 数据库连接失败

```bash
# 检查连接字符串
echo $DATABASE_URL

# 测试连接
psql $DATABASE_URL -c "SELECT 1"
```

### 问题 2: 文件上传失败

```bash
# 检查上传目录权限
ls -la public/uploads/

# 创建目录
mkdir -p public/uploads/chain-recordings
mkdir -p public/uploads/recordings
chmod 755 public/uploads
```

### 问题 3: 内存泄漏

当前使用内存 Map 存储数据，长期运行可能导致内存泄漏。

**解决方案**: 迁移到数据库存储。

## 监控清单

部署后定期检查:

- [ ] 应用正常运行
- [ ] 数据库连接正常
- [ ] 文件上传功能正常
- [ ] 错误日志正常
- [ ] 性能指标正常
- [ ] 磁盘空间充足
- [ ] 数据库备份完成

## 回滚计划

如果部署出现问题:

```bash
# 1. 停止应用
pm2 stop karaoke

# 2. 恢复代码
git revert HEAD

# 3. 重新构建
npm run build

# 4. 启动应用
pm2 start karaoke
```

## 联系支持

如有问题，请检查:
- 应用日志: `pm2 logs karaoke`
- 数据库日志: `/var/log/postgresql/`
- Nginx 日志: `/var/log/nginx/`
