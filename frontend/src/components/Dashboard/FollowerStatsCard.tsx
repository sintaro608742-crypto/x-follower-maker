import React, { useEffect, useState } from 'react';
import { Box, Card, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import type { FollowerStatsData } from '@/types';

interface FollowerStatsCardProps {
  stats: FollowerStatsData;
}

export const FollowerStatsCard: React.FC<FollowerStatsCardProps> = ({ stats }) => {
  const [displayCount, setDisplayCount] = useState(0);

  // カウントアップアニメーション
  useEffect(() => {
    let start = stats.previousCount;
    const end = stats.currentCount;
    const duration = 1500;
    const increment = (end - start) / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if ((increment > 0 && start >= end) || (increment < 0 && start <= end)) {
        setDisplayCount(end);
        clearInterval(timer);
      } else {
        setDisplayCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [stats.currentCount, stats.previousCount]);

  // グラフ用データの整形
  const chartData = stats.history.map(item => ({
    date: new Date(item.recorded_at).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric'
    }),
    followers: item.follower_count
  }));

  const growthColor = stats.growthCount >= 0 ? '#34D399' : '#EF4444';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card
        sx={{
          p: 4.5,
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
          borderRadius: 2,
          boxShadow: '0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)'
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3.5
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              フォロワー数推移（過去30日）
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontFamily: 'SF Mono, Monaco, monospace',
                fontWeight: 700,
                color: '#1F2937',
                mb: 1
              }}
            >
              {displayCount.toLocaleString()}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendingUp size={20} color={growthColor} />
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  color: growthColor
                }}
              >
                {stats.growthCount >= 0 ? '+' : ''}
                {stats.growthCount.toLocaleString()} ({stats.growthRate}
                {stats.growthRate >= 0 ? '% up' : '% down'})
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* グラフ表示 */}
        <Box
          sx={{
            width: '100%',
            height: 200,
            bgcolor: '#F9FAFB',
            borderRadius: 1.5,
            p: 2
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value: number) => value.toLocaleString()}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
                formatter={(value: number) => [value.toLocaleString(), 'フォロワー数']}
              />
              <Line
                type="monotone"
                dataKey="followers"
                stroke="#1DA1F2"
                strokeWidth={3}
                dot={{ fill: '#1DA1F2', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Card>
    </motion.div>
  );
};
