#!/bin/bash

# 合唱 Karaoke 应用启动脚本

echo "🎤 合唱 Karaoke 应用启动"
echo "========================"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 启动数据库
echo "📦 启动 PostgreSQL 数据库..."
docker-compose up -d

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 5

# 检查数据库连接
echo "🔍 检查数据库连接..."
if ! docker-compose exec -T postgres pg_isready -U karaoke_user &> /dev/null; then
    echo "❌ 数据库启动失败"
    exit 1
fi

echo "✅ 数据库已启动"

# 初始化数据库
echo "🗄️  初始化数据库..."
npx prisma migrate deploy --skip-generate

# 启动开发服务器
echo "🚀 启动开发服务器..."
echo "📱 访问 http://localhost:3000"
echo ""

npm run dev
