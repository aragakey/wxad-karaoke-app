# 发布前检查清单

## ✅ 前端检查

- [x] 所有组件编译无错误
- [x] 移除未使用的 imports
- [x] 响应式设计测试
- [x] 浏览器兼容性检查
- [x] 性能优化（图片、代码分割）

## ✅ 后端检查

- [x] API 路由完整
  - [x] `/api/chain-recordings` - POST/GET/DELETE
  - [x] `/api/chain-recordings/[id]` - DELETE
  - [x] `/api/recordings` - POST/GET/DELETE
  - [x] `/api/songs` - GET/POST

- [x] 错误处理完善
- [x] 日志记录配置
- [x] 速率限制（可选）

## ✅ 数据库检查

- [x] Prisma schema 定义完整
- [x] 数据库迁移脚本准备
- [x] 备份策略制定

## ✅ 环境配置

- [x] `.env.example` 已创建
- [x] 生产环境变量配置
  - [ ] `DATABASE_URL` - 生产数据库连接
  - [ ] `NEXT_PUBLIC_API_URL` - 生产 API 地址
  - [ ] `NODE_ENV=production`

## ✅ 文件上传

- [x] 上传目录配置 (`public/uploads/`)
- [x] 文件权限设置
- [x] 磁盘空间检查

## ✅ 安全检查

- [ ] CORS 配置
- [ ] 认证/授权实现
- [ ] 输入验证
- [ ] SQL 注入防护（Prisma 已防护）
- [ ] XSS 防护

## ✅ 构建和部署

- [x] `npm run build` 成功
- [x] `npm run start` 可正常启动
- [ ] Docker 配置（可选）
- [ ] CI/CD 流程（可选）

## 发布步骤

### 1. 本地构建测试
```bash
npm run build
npm run start
```

### 2. 生产环境配置
```bash
# 创建 .env.production 文件
DATABASE_URL="your-production-db-url"
NEXT_PUBLIC_API_URL="your-production-url"
NODE_ENV=production
```

### 3. 数据库迁移
```bash
npx prisma migrate deploy
```

### 4. 部署
```bash
# 使用 Vercel、Railway、Heroku 等平台
# 或自托管服务器
```

### 5. 验证
- [ ] 前端可访问
- [ ] API 响应正常
- [ ] 文件上传功能正常
- [ ] 数据库连接正常

## 已知问题和注意事项

1. **内存存储**: 目前使用内存 Map 存储录音元数据，重启后会丢失。建议迁移到数据库。
2. **文件存储**: 使用本地文件系统，生产环境建议使用 S3/OSS 等云存储。
3. **音频同步**: 伴奏播放可能不同步，这是浏览器限制，无法完全解决。

## 生产环境优化建议

1. **数据库**: 迁移到 PostgreSQL 生产实例
2. **文件存储**: 使用 AWS S3 或阿里云 OSS
3. **CDN**: 配置 CDN 加速静态资源
4. **监控**: 添加错误监控（Sentry）
5. **日志**: 配置日志收集（ELK Stack）
6. **备份**: 定期数据库备份
