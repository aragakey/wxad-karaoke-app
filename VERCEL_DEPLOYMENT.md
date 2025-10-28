# Vercel 部署配置指南

## 问题
在 Vercel 上上传录音失败（500 错误），原因是：
1. Vercel 是无状态的，不能写入文件系统
2. 内存数据库（Map）在 Vercel 上会丢失

## 解决方案
使用 PostgreSQL 数据库存储音频数据（base64 编码）

## 部署步骤

### 1. 创建 PostgreSQL 数据库

**选项 A: 使用 Vercel Postgres**
```bash
# 在 Vercel 仪表板中创建 Postgres 数据库
# 自动生成 DATABASE_URL
```

**选项 B: 使用其他 PostgreSQL 服务**
- Neon (https://neon.tech)
- Railway (https://railway.app)
- AWS RDS
- DigitalOcean

### 2. 配置环境变量

在 Vercel 项目设置中添加：
```
DATABASE_URL=postgresql://user:password@host:port/database
```

### 3. 运行数据库迁移

```bash
# 本地运行迁移
npx prisma migrate deploy

# 或创建新迁移
npx prisma migrate dev --name add_chain_recording
```

### 4. 部署到 Vercel

```bash
git add .
git commit -m "feat: migrate to database-backed recording storage"
git push
```

Vercel 会自动：
1. 检测 Next.js 项目
2. 安装依赖
3. 运行构建
4. 部署应用

## 数据库架构

### ChainRecording 表
```sql
CREATE TABLE "ChainRecording" (
  id TEXT PRIMARY KEY,
  songId TEXT NOT NULL,
  userId TEXT NOT NULL,
  startTime FLOAT NOT NULL,
  endTime FLOAT NOT NULL,
  audioData TEXT NOT NULL,  -- base64 编码的音频
  mimeType TEXT NOT NULL,   -- audio/webm, audio/mp4 等
  fileName TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chain_recording_songId ON "ChainRecording"(songId);
CREATE INDEX idx_chain_recording_userId ON "ChainRecording"(userId);
```

## 性能考虑

### 优点
- ✅ 数据持久化
- ✅ 支持 Vercel 无状态架构
- ✅ 可扩展
- ✅ 支持多个实例

### 缺点
- ❌ 数据库存储成本（大文件）
- ❌ 查询速度可能较慢

### 优化建议

**如果音频文件很大（> 1MB）**，考虑使用云存储：

#### 选项 1: Vercel Blob
```typescript
import { put } from '@vercel/blob';

const blob = await put(`recordings/${id}`, file, {
  access: 'public',
});

// 存储 blob.url 到数据库
```

#### 选项 2: AWS S3
```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: "us-east-1" });
await s3.send(new PutObjectCommand({
  Bucket: process.env.AWS_BUCKET,
  Key: `recordings/${id}`,
  Body: buffer,
}));
```

#### 选项 3: Cloudinary
```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('upload_preset', process.env.CLOUDINARY_PRESET);

const response = await fetch(
  `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD}/upload`,
  { method: 'POST', body: formData }
);
```

## 本地开发

### 启动本地 PostgreSQL
```bash
# 使用 Docker
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# 或使用 Vercel CLI
vercel env pull
```

### 运行迁移
```bash
npx prisma migrate dev
```

### 启动开发服务器
```bash
npm run dev
```

## 故障排除

### 错误: "DATABASE_URL is not set"
```bash
# 检查环境变量
echo $DATABASE_URL

# 或在 .env.local 中设置
DATABASE_URL=postgresql://...
```

### 错误: "Connection refused"
- 检查数据库是否在线
- 检查防火墙规则
- 检查连接字符串

### 错误: "Relation does not exist"
```bash
# 运行迁移
npx prisma migrate deploy

# 或重新生成 Prisma 客户端
npx prisma generate
```

### 上传仍然失败
1. 检查 Vercel 日志：`vercel logs`
2. 检查数据库连接
3. 检查文件大小限制
4. 检查 API 超时设置

## 监控

### 查看 Vercel 日志
```bash
vercel logs
```

### 查看数据库
```bash
# 使用 Prisma Studio
npx prisma studio

# 或使用数据库客户端连接
psql $DATABASE_URL
```

## 成本估算

### Vercel Postgres
- 免费层：3GB 存储
- 付费：按使用量计费

### 其他选项
- Neon: 免费 3GB，超出按量计费
- Railway: 按使用量计费
- AWS RDS: 按实例类型计费

## 下一步

1. ✅ 创建数据库
2. ✅ 配置 DATABASE_URL
3. ✅ 运行迁移
4. ✅ 部署到 Vercel
5. ✅ 测试上传功能
6. ✅ 监控日志

## 相关文件

- `prisma/schema.prisma` - 数据库架构
- `src/lib/prisma.ts` - Prisma 客户端
- `src/app/api/chain-recordings/route.ts` - API 路由
- `src/app/api/chain-recordings/[id]/audio/route.ts` - 音频获取
