import React from 'react';
import { Box, Card, Chip, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { Clock, Check, Heart, Repeat, MessageCircle, List } from 'lucide-react';
import type { Post, PostStatus } from '@/types';

interface PostsListProps {
  title: string;
  posts: Post[];
  icon?: React.ReactNode;
  showEngagement?: boolean;
}

const getStatusConfig = (status: PostStatus) => {
  switch (status) {
    case 'scheduled':
      return {
        label: '予約中',
        icon: <Clock size={12} />,
        bgcolor: '#E0F2FE',
        color: '#0369A1'
      };
    case 'posted':
      return {
        label: '投稿済み',
        icon: <Check size={12} />,
        bgcolor: '#34D399',
        color: '#FFFFFF'
      };
    case 'failed':
      return {
        label: '失敗',
        icon: <Clock size={12} />,
        bgcolor: '#FEE2E2',
        color: '#DC2626'
      };
    default:
      return {
        label: '未承認',
        icon: <Clock size={12} />,
        bgcolor: '#F3F4F6',
        color: '#6B7280'
      };
  }
};

const formatPostTime = (dateString: string, status: PostStatus) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (status === 'scheduled') {
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  }

  if (diffDays === 0) {
    return '今日 ' + date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return '昨日 ' + date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }) +
      ' ' + date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  }
};

export const PostsList: React.FC<PostsListProps> = ({
  title,
  posts,
  icon,
  showEngagement = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card
        sx={{
          p: 3.5,
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFBFC 100%)',
          borderRadius: 2,
          boxShadow: '0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5 }}>
          {icon || <List size={20} />}
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
          {posts.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              投稿がありません
            </Typography>
          ) : (
            posts.map((post, index) => {
              const statusConfig = getStatusConfig(post.status);
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Box
                    sx={{
                      p: 2.5,
                      bgcolor: 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
                      borderRadius: 1.5,
                      border: '1px solid #E5E7EB',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.12)'
                      }
                    }}
                  >
                    {/* Post Header */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#9CA3AF',
                          fontSize: '14px'
                        }}
                      >
                        {formatPostTime(
                          post.scheduled_at,
                          post.status
                        )}
                      </Typography>
                      <Chip
                        icon={statusConfig.icon}
                        label={statusConfig.label}
                        size="small"
                        sx={{
                          bgcolor: statusConfig.bgcolor,
                          color: statusConfig.color,
                          fontWeight: 500,
                          fontSize: '12px',
                          height: '24px'
                        }}
                      />
                    </Box>

                    {/* Post Content */}
                    <Typography
                      variant="body2"
                      sx={{
                        lineHeight: 1.5,
                        mb: showEngagement && post.engagement ? 1 : 0,
                        color: '#1F2937'
                      }}
                    >
                      {post.content}
                    </Typography>

                    {/* Engagement Stats */}
                    {showEngagement && post.engagement && (
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 2,
                          fontSize: '12px',
                          color: '#9CA3AF'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Heart size={12} />
                          <span>{post.engagement.likes}</span>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Repeat size={12} />
                          <span>{post.engagement.retweets}</span>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <MessageCircle size={12} />
                          <span>{post.engagement.replies}</span>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </motion.div>
              );
            })
          )}
        </Box>
      </Card>
    </motion.div>
  );
};
