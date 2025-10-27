#!/bin/bash

# 清除指定用户的所有录音数据（内存 + 文件系统）
# 使用方法: ./scripts/clear-user-data.sh <userId>

if [ -z "$1" ]; then
  echo "❌ 错误: 请提供用户 ID"
  echo "使用方法: ./scripts/clear-user-data.sh <userId>"
  exit 1
fi

USER_ID=$1
BASE_URL="${2:-http://localhost:3000}"

echo "🗑️  正在清除用户 $USER_ID 的数据..."
echo ""

# 清除 chain-recordings
echo "📍 清除 chain-recordings..."
RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/chain-recordings?userId=$USER_ID")
echo "响应: $RESPONSE"
echo ""

# 清除 recordings
echo "📍 清除 recordings..."
RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/recordings?userId=$USER_ID")
echo "响应: $RESPONSE"
echo ""

echo "✅ 完成!"
