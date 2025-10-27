'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

export default function ClearDataPage() {
  const [userId, setUserId] = useState('aragakey');
  const [isLoading, setIsLoading] = useState(false);

  const handleClearData = async () => {
    if (!userId.trim()) {
      toast.error('请输入用户 ID');
      return;
    }

    if (!confirm(`确定要删除用户 "${userId}" 的所有录音数据吗？此操作不可撤销！`)) {
      return;
    }

    setIsLoading(true);
    try {
      // 清除 chain-recordings
      const chainRes = await fetch(`/api/chain-recordings?userId=${userId}`, {
        method: 'DELETE',
      });
      const chainData = await chainRes.json();

      // 清除 recordings
      const recordingsRes = await fetch(`/api/recordings?userId=${userId}`, {
        method: 'DELETE',
      });
      const recordingsData = await recordingsRes.json();

      const totalDeleted = (chainData.deletedCount || 0) + (recordingsData.deletedCount || 0);

      if (totalDeleted > 0) {
        toast.success(`✅ 成功删除 ${totalDeleted} 条录音记录`);
      } else {
        toast.info('没有找到该用户的录音记录');
      }

      setUserId('');
    } catch (error) {
      console.error('Failed to clear data:', error);
      toast.error('删除失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-md mx-auto">
        <Card className="border-red-500/20 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="w-5 h-5" />
              清除用户数据
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                用户 ID
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="输入用户 ID"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
              <p className="text-sm text-red-300">
                ⚠️ 警告：此操作将删除该用户的所有录音数据，包括：
              </p>
              <ul className="text-sm text-red-300 mt-2 ml-4 list-disc">
                <li>Chain recordings（链式录音）</li>
                <li>Regular recordings（普通录音）</li>
              </ul>
            </div>

            <Button
              onClick={handleClearData}
              disabled={isLoading || !userId.trim()}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? '删除中...' : '确认删除'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
