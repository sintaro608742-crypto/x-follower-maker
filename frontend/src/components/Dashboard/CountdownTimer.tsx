import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import type { CountdownData } from '@/types';

interface CountdownTimerProps {
  initialCountdown: CountdownData;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ initialCountdown }) => {
  const [countdown, setCountdown] = useState(initialCountdown);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const nextPost = new Date(countdown.nextPostTime);
      const diff = nextPost.getTime() - now.getTime();

      if (diff <= 0) {
        // 次の投稿時刻に到達した場合は更新を停止
        clearInterval(timer);
        setCountdown({ hours: 0, minutes: 0, seconds: 0, nextPostTime: countdown.nextPostTime });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setCountdown({
          hours,
          minutes,
          seconds,
          nextPostTime: countdown.nextPostTime
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown.nextPostTime]);

  const formatTime = (value: number) => String(value).padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Box
        sx={{
          background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
          borderRadius: 1.5,
          p: 2.5,
          textAlign: 'center',
          borderLeft: '4px solid #1DA1F2',
          boxShadow: '0 2px 4px rgba(29, 161, 242, 0.1)',
          mt: 2
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: '#1E40AF',
            fontWeight: 600,
            mb: 1
          }}
        >
          次の投稿まで
        </Typography>
        <Typography
          variant="h4"
          sx={{
            fontFamily: 'SF Mono, Monaco, monospace',
            fontWeight: 700,
            color: '#1DA1F2',
            letterSpacing: 2
          }}
        >
          {formatTime(countdown.hours)}:{formatTime(countdown.minutes)}:
          {formatTime(countdown.seconds)}
        </Typography>
      </Box>
    </motion.div>
  );
};
