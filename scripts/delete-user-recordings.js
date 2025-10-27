#!/usr/bin/env node

/**
 * 删除指定用户的所有录音数据
 * 使用方法: node scripts/delete-user-recordings.js <userId>
 */

const fs = require('fs');
const path = require('path');

const userId = process.argv[2];

if (!userId) {
  console.error('❌ 错误: 请提供用户 ID');
  console.error('使用方法: node scripts/delete-user-recordings.js <userId>');
  process.exit(1);
}

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
const chainRecordingsDir = path.join(uploadsDir, 'chain-recordings');
const recordingsDir = path.join(uploadsDir, 'recordings');

let deletedCount = 0;

// 删除 chain-recordings 中的文件
if (fs.existsSync(chainRecordingsDir)) {
  const files = fs.readdirSync(chainRecordingsDir);
  files.forEach(file => {
    if (file.includes(userId)) {
      const filePath = path.join(chainRecordingsDir, file);
      fs.unlinkSync(filePath);
      console.log(`✓ 已删除: ${file}`);
      deletedCount++;
    }
  });
}

// 删除 recordings 中的文件
if (fs.existsSync(recordingsDir)) {
  const files = fs.readdirSync(recordingsDir);
  files.forEach(file => {
    if (file.includes(userId)) {
      const filePath = path.join(recordingsDir, file);
      fs.unlinkSync(filePath);
      console.log(`✓ 已删除: ${file}`);
      deletedCount++;
    }
  });
}

console.log(`\n✅ 完成! 共删除 ${deletedCount} 个文件`);
console.log(`\n📝 注意: 如果使用了数据库 (Prisma)，请运行以下命令删除数据库记录:`);
console.log(`   npx prisma db execute --stdin < scripts/delete-user-recordings.sql`);
