#!/bin/bash

echo "🔍 发布前检查..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查计数
PASSED=0
FAILED=0

# 检查函数
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $1"
        ((FAILED++))
    fi
}

# 1. 检查 Node.js
echo "📦 检查依赖..."
node --version > /dev/null 2>&1
check "Node.js 已安装"

npm --version > /dev/null 2>&1
check "npm 已安装"

# 2. 检查依赖安装
[ -d "node_modules" ]
check "依赖已安装"

# 3. 检查构建
echo ""
echo "🔨 检查构建..."
npm run build > /dev/null 2>&1
check "构建成功"

# 4. 检查 TypeScript
echo ""
echo "📝 检查 TypeScript..."
npx tsc --noEmit > /dev/null 2>&1
check "TypeScript 编译无错误"

# 5. 检查环境变量
echo ""
echo "🔐 检查环境变量..."
[ -f ".env.example" ]
check ".env.example 存在"

[ -f ".env.production" ] || [ -f ".env.local" ]
check "环境变量文件存在"

# 6. 检查数据库配置
echo ""
echo "🗄️  检查数据库..."
[ -f "prisma/schema.prisma" ]
check "Prisma schema 存在"

# 7. 检查上传目录
echo ""
echo "📁 检查上传目录..."
[ -d "public/uploads" ]
check "上传目录存在"

# 8. 检查 API 路由
echo ""
echo "🛣️  检查 API 路由..."
[ -f "src/app/api/chain-recordings/route.ts" ]
check "chain-recordings API 存在"

[ -f "src/app/api/recordings/route.ts" ]
check "recordings API 存在"

[ -f "src/app/api/songs/route.ts" ]
check "songs API 存在"

# 9. 检查主要组件
echo ""
echo "⚛️  检查组件..."
[ -f "src/components/ChainRecorder.tsx" ]
check "ChainRecorder 组件存在"

[ -f "src/components/KaraokeDisplay.tsx" ]
check "KaraokeDisplay 组件存在"

# 10. 检查配置文件
echo ""
echo "⚙️  检查配置..."
[ -f "next.config.ts" ]
check "next.config.ts 存在"

[ -f "tsconfig.json" ]
check "tsconfig.json 存在"

[ -f "postcss.config.mjs" ]
check "postcss.config.mjs 存在"

# 总结
echo ""
echo "================================"
echo -e "检查完成: ${GREEN}$PASSED 通过${NC}, ${RED}$FAILED 失败${NC}"
echo "================================"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ 所有检查通过，可以发布！${NC}"
    exit 0
else
    echo -e "${RED}✗ 有 $FAILED 项检查失败，请修复后再发布${NC}"
    exit 1
fi
