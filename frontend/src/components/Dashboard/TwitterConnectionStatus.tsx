import React from 'react';
import { Box, Button, Card, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { Twitter, Link as LinkIcon } from 'lucide-react';
import type { TwitterConnectionStatus as ConnectionStatus } from '@/types';

interface TwitterConnectionStatusProps {
  status: ConnectionStatus;
  username?: string;
  onConnect: () => void;
  onDisconnect?: () => void;
}

export const TwitterConnectionStatus: React.FC<TwitterConnectionStatusProps> = ({
  status,
  username,
  onConnect,
  onDisconnect
}) => {
  const isConnected = status === 'connected';
  const borderColor = isConnected ? '#34D399' : '#FBBF24';
  const iconBgColor = isConnected ? '#34D399' : '#FBBF24';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        sx={{
          p: 3.5,
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
          borderRadius: 2,
          border: `2px solid ${borderColor}`,
          boxShadow: '0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: iconBgColor,
              color: 'white'
            }}
          >
            <Twitter size={20} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              X（Twitter）連携
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isConnected
                ? `${username} として連携中`
                : 'アカウントを連携すると自動投稿が開始されます'}
            </Typography>
          </Box>
        </Box>

        {isConnected ? (
          <Button
            variant="outlined"
            color="error"
            onClick={onDisconnect}
            sx={{
              borderRadius: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              px: 3
            }}
          >
            連携を解除
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={onConnect}
            startIcon={<LinkIcon size={20} />}
            sx={{
              background: 'linear-gradient(135deg, #1DA1F2 0%, #0E7FC7 100%)',
              borderRadius: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              px: 3,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              '&:hover': {
                transform: 'translateY(-3px) scale(1.02)',
                boxShadow: '0 8px 16px rgba(29, 161, 242, 0.4)'
              }
            }}
          >
            Xアカウントと連携
          </Button>
        )}
      </Card>
    </motion.div>
  );
};
