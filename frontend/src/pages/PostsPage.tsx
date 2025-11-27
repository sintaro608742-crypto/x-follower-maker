import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarClock,
  Pencil,
  RefreshCw,
  Trash2,
  Check,
  Eye,
  Heart,
  Repeat2,
  MessageCircle,
  Share,
  ExternalLink,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { MainLayout } from '@/layouts/MainLayout';
import { usePostsData } from '@/hooks/usePostsData';
import type { Post, PostFilter, PostStatus } from '@/types';

const FILTER_OPTIONS: { value: PostFilter; label: string }[] = [
  { value: 'today', label: '今日' },
  { value: 'tomorrow', label: '明日' },
  { value: 'week', label: '今週' },
  { value: 'all', label: 'すべて' },
];

const getStatusConfig = (status: PostStatus) => {
  switch (status) {
    case 'scheduled':
      return {
        icon: <Clock size={16} />,
        label: '予約中',
        description: '自動で投稿されます',
        color: '#1DA1F2',
        bgGradient: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
        textColor: '#1E40AF',
      };
    case 'posted':
      return {
        icon: <CheckCircle size={16} />,
        label: '投稿済み',
        description: 'Xに投稿されました',
        color: '#10B981',
        bgGradient: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
        textColor: '#065F46',
      };
    case 'failed':
      return {
        icon: <XCircle size={16} />,
        label: '投稿エラー',
        description: '投稿に失敗しました',
        color: '#EF4444',
        bgGradient: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
        textColor: '#991B1B',
      };
    case 'unapproved':
      return {
        icon: <AlertCircle size={16} />,
        label: '承認待ち',
        description: '承認すると投稿されます',
        color: '#F59E0B',
        bgGradient: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
        textColor: '#92400E',
      };
  }
};

const getCharacterCountColor = (length: number) => {
  if (length > 280) return '#EF4444';
  if (length > 240) return '#F59E0B';
  return '#6B7280';
};

interface PostCardProps {
  post: Post;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
  onApprove?: () => void;
  onRetry?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  isSelected,
  onClick,
  onEdit,
  onRegenerate,
  onDelete,
  onApprove,
  onRetry,
}) => {
  const statusConfig = getStatusConfig(post.status);
  const characterCount = post.content.length;
  const remaining = 280 - characterCount;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        onClick={onClick}
        sx={{
          p: 3,
          cursor: 'pointer',
          borderLeft: `5px solid ${statusConfig.color}`,
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFBFC 100%)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: isSelected ? `2px solid ${statusConfig.color}` : '2px solid transparent',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.06)',
          },
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Chip
              icon={statusConfig.icon}
              label={statusConfig.label}
              sx={{
                background: statusConfig.bgGradient,
                color: statusConfig.textColor,
                fontWeight: 700,
                fontSize: '14px',
                mb: 1,
              }}
            />
            <Typography variant="caption" sx={{ display: 'block', color: '#6B7280', fontWeight: 500, mb: 0.5 }}>
              {statusConfig.description}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarClock size={14} color="#6B7280" />
              <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600 }}>
                {new Date(post.scheduled_at).toLocaleString('ja-JP', {
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {post.status === 'posted' ? ' に投稿' : ' に投稿予定'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Content */}
        <Typography
          variant="body1"
          sx={{
            mb: 2,
            lineHeight: 1.7,
            fontWeight: 500,
            whiteSpace: 'pre-wrap',
            '& .hashtag': { color: '#1DA1F2', fontWeight: 600 },
          }}
          dangerouslySetInnerHTML={{
            __html: post.content.replace(/#(\S+)/g, '<span class="hashtag">#$1</span>'),
          }}
        />

        {/* Character Count */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            p: 1,
            background: '#F9FAFB',
            borderRadius: '8px',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 700,
              color: getCharacterCountColor(characterCount),
            }}
          >
            {characterCount}/280
          </Typography>
          <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 500 }}>
            残り {remaining}文字
          </Typography>
        </Box>

        {/* Engagement Stats (Posted only) */}
        {post.status === 'posted' && post.engagement && (
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              p: 2,
              mb: 2,
              background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
              borderRadius: '12px',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Heart size={18} color="#6B7280" />
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#1F2937' }}>
                {post.engagement.likes}
              </Typography>
              <Typography variant="caption" sx={{ color: '#9CA3AF' }}>いいね</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Repeat2 size={18} color="#6B7280" />
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#1F2937' }}>
                {post.engagement.retweets}
              </Typography>
              <Typography variant="caption" sx={{ color: '#9CA3AF' }}>リポスト</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MessageCircle size={18} color="#6B7280" />
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#1F2937' }}>
                {post.engagement.replies}
              </Typography>
              <Typography variant="caption" sx={{ color: '#9CA3AF' }}>返信</Typography>
            </Box>
          </Box>
        )}

        {/* Error Alert (Failed only) */}
        {post.status === 'failed' && post.error_message && (
          <Alert
            severity="error"
            icon={<AlertTriangle size={16} />}
            sx={{ mb: 2 }}
          >
            <AlertTitle sx={{ fontWeight: 700, fontSize: '14px' }}>投稿エラー</AlertTitle>
            <Typography variant="body2">{post.error_message}</Typography>
          </Alert>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {post.status === 'unapproved' && onApprove && (
            <Button
              size="small"
              variant="contained"
              startIcon={<Check size={16} />}
              onClick={(e) => { e.stopPropagation(); onApprove(); }}
              sx={{
                background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
                color: '#065F46',
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(135deg, #A7F3D0 0%, #6EE7B7 100%)',
                  transform: 'translateY(-2px) scale(1.05)',
                },
              }}
            >
              承認する
            </Button>
          )}
          {post.status === 'failed' && onRetry && (
            <Button
              size="small"
              variant="contained"
              startIcon={<RefreshCw size={16} />}
              onClick={(e) => { e.stopPropagation(); onRetry(); }}
              sx={{
                background: 'linear-gradient(135deg, #1DA1F2 0%, #0E7FC7 100%)',
                color: '#FFFFFF',
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(135deg, #0E7FC7 0%, #0369A1 100%)',
                  transform: 'translateY(-2px) scale(1.05)',
                },
              }}
            >
              再試行する
            </Button>
          )}
          {post.status === 'posted' ? (
            <Button
              size="small"
              variant="outlined"
              startIcon={<ExternalLink size={16} />}
              onClick={(e) => { e.stopPropagation(); window.open(`https://twitter.com/i/web/status/${post.twitter_tweet_id}`, '_blank'); }}
              sx={{
                borderColor: '#BFDBFE',
                color: '#1E40AF',
                background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(135deg, #BFDBFE 0%, #93C5FD 100%)',
                  transform: 'translateY(-2px) scale(1.05)',
                },
              }}
            >
              Xで見る
            </Button>
          ) : (
            <>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Pencil size={16} />}
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                sx={{
                  borderColor: '#BFDBFE',
                  color: '#1E40AF',
                  background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #BFDBFE 0%, #93C5FD 100%)',
                    transform: 'translateY(-2px) scale(1.05)',
                  },
                }}
              >
                編集する
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<RefreshCw size={16} />}
                onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
                sx={{
                  borderColor: '#C7D2FE',
                  color: '#4338CA',
                  background: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #C7D2FE 0%, #A5B4FC 100%)',
                    transform: 'translateY(-2px) scale(1.05)',
                  },
                }}
              >
                AIで再生成
              </Button>
            </>
          )}
          <Button
            size="small"
            variant="outlined"
            startIcon={<Trash2 size={16} />}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            sx={{
              borderColor: '#FECACA',
              color: '#991B1B',
              background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #FECACA 0%, #FCA5A5 100%)',
                transform: 'translateY(-2px) scale(1.05)',
              },
            }}
          >
            削除
          </Button>
        </Box>
      </Paper>
    </motion.div>
  );
};

interface DateGroupProps {
  displayLabel: string;
  count: number;
  children: React.ReactNode;
}

const DateGroup: React.FC<DateGroupProps> = ({ displayLabel, count, children }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Box sx={{ mb: 4 }}>
      <Paper
        onClick={() => setIsExpanded(!isExpanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          mb: 2,
          cursor: 'pointer',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
          transition: 'all 0.3s',
          '&:hover': {
            boxShadow: 2,
            transform: 'translateY(-2px)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Calendar size={20} color="#111827" />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>
            {displayLabel}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={`${count}件`}
            size="small"
            sx={{
              fontWeight: 600,
              background: '#FFFFFF',
              color: '#6B7280',
            }}
          />
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </Box>
      </Paper>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {children}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

interface TweetPreviewPanelProps {
  post: Post | null;
}

const TweetPreviewPanel: React.FC<TweetPreviewPanelProps> = ({ post }) => {
  return (
    <Box sx={{ position: 'sticky', top: 24 }}>
      <Paper
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, pb: 2, borderBottom: '2px solid #F3F4F6' }}>
          <Eye size={24} color="#1DA1F2" />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>
            ツイートプレビュー
          </Typography>
        </Box>

        {post ? (
          <Box
            sx={{
              border: '2px solid #E5E7EB',
              borderRadius: 2,
              p: 2.5,
              background: '#FFFFFF',
            }}
          >
            {/* Tweet Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '20px',
                }}
              >
                Y
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1F2937' }}>
                  あなたの名前
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>
                  @your_username
                </Typography>
              </Box>
            </Box>

            {/* Tweet Content */}
            <Typography
              variant="body1"
              sx={{
                mb: 2,
                lineHeight: 1.7,
                fontWeight: 500,
                whiteSpace: 'pre-wrap',
                '& .hashtag': { color: '#1DA1F2', fontWeight: 600 },
              }}
              dangerouslySetInnerHTML={{
                __html: post.content.replace(/#(\S+)/g, '<span class="hashtag">#$1</span>'),
              }}
            />

            {/* Tweet Timestamp */}
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: '#6B7280',
                fontWeight: 500,
                mb: 2,
                pb: 2,
                borderBottom: '1px solid #E5E7EB',
              }}
            >
              {new Date(post.scheduled_at).toLocaleString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>

            {/* Tweet Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'space-around', pt: 1 }}>
              {[
                { icon: <MessageCircle size={18} />, count: 0 },
                { icon: <Repeat2 size={18} />, count: 0 },
                { icon: <Heart size={18} />, count: 0 },
                { icon: <Share size={18} />, count: null },
              ].map((action, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: '#6B7280',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    p: 1,
                    borderRadius: 1,
                    transition: 'all 0.3s',
                    '&:hover': {
                      color: '#1DA1F2',
                      background: '#F0F9FF',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  {action.icon}
                  {action.count !== null && <span>{action.count}</span>}
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              投稿を選択してください
            </Typography>
          </Box>
        )}

        {/* Hint Box */}
        <Box
          sx={{
            mt: 2.5,
            p: 2,
            background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
            borderRadius: 1.5,
            borderLeft: '4px solid #1DA1F2',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Lightbulb size={16} color="#1E40AF" />
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#1E40AF' }}>
              使い方のヒント
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 500, lineHeight: 1.5 }}>
            投稿カードをクリックすると、このプレビューに表示されます。実際のXでの見た目を確認できます。
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export const PostsPage: React.FC = () => {
  const {
    groupedPosts,
    loading,
    error,
    selectedPost,
    selectedPostId,
    filter,
    setFilter,
    setSelectedPostId,
    updatePost,
    deletePost,
    regeneratePost,
    approvePost,
    retryPost,
    createManualPost,
  } = usePostsData();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editPostId, setEditPostId] = useState<string | null>(null);
  const [editScheduledAt, setEditScheduledAt] = useState('');

  // 手動投稿追加用
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostScheduledAt, setNewPostScheduledAt] = useState('');
  const [creating, setCreating] = useState(false);

  // Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // ローカルタイムゾーンでdatetime-local用の形式に変換するヘルパー
  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleOpenCreateDialog = () => {
    // デフォルトで1時間後を設定
    const defaultTime = new Date();
    defaultTime.setHours(defaultTime.getHours() + 1);
    defaultTime.setMinutes(0);
    const formatted = formatDateTimeLocal(defaultTime);
    setNewPostScheduledAt(formatted);
    setNewPostContent('');
    setCreateDialogOpen(true);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !newPostScheduledAt) {
      showSnackbar('投稿内容と予約時間を入力してください', 'error');
      return;
    }
    if (newPostContent.length > 280) {
      showSnackbar('投稿は280文字以内にしてください', 'error');
      return;
    }
    try {
      setCreating(true);
      await createManualPost(newPostContent, newPostScheduledAt);
      showSnackbar('投稿を作成しました', 'success');
      setCreateDialogOpen(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      showSnackbar(error.message || '投稿の作成に失敗しました', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (post: Post) => {
    setEditPostId(post.id);
    setEditContent(post.content);
    // ローカルタイムゾーンでdatetime-local用の形式に変換
    const date = new Date(post.scheduled_at);
    const formatted = formatDateTimeLocal(date);
    setEditScheduledAt(formatted);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editPostId) {
      await updatePost({
        post_id: editPostId,
        content: editContent,
        scheduled_at: editScheduledAt ? new Date(editScheduledAt).toISOString() : undefined,
      });
      setEditDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Alert severity="error">{error.message}</Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Page Header */}
        <Box sx={{ mb: 4, pb: 3 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 800,
              mb: 1,
              background: 'linear-gradient(135deg, #1DA1F2 0%, #0E7FC7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            AI投稿プレビュー・編集
          </Typography>
          <Typography variant="body1" sx={{ color: '#6B7280', fontWeight: 500 }}>
            AIが生成した投稿を確認・編集して、質の高いツイートを投稿しましょう
          </Typography>
        </Box>

        {/* Action Bar */}
        <Paper
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2.5,
            mb: 4,
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            {FILTER_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                onClick={() => setFilter(option.value)}
                sx={{
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  ...(filter === option.value
                    ? {
                        background: 'linear-gradient(135deg, #1DA1F2 0%, #0E7FC7 100%)',
                        color: '#FFFFFF',
                        boxShadow: '0 4px 12px rgba(29, 161, 242, 0.4)',
                        transform: 'translateY(-2px)',
                      }
                    : {
                        background: '#FFFFFF',
                        color: '#6B7280',
                        border: '2px solid #E5E7EB',
                        '&:hover': {
                          background: '#F0F9FF',
                          borderColor: '#1DA1F2',
                          transform: 'translateY(-2px)',
                        },
                      }),
                }}
              />
            ))}
          </Box>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={handleOpenCreateDialog}
            sx={{
              background: 'linear-gradient(135deg, #1DA1F2 0%, #0E7FC7 100%)',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #0E7FC7 0%, #0369A1 100%)',
                transform: 'translateY(-3px) scale(1.02)',
              },
            }}
          >
            手動投稿を追加
          </Button>
        </Paper>

        {/* Main Layout: 2 Columns */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 420px' }, gap: 4 }}>
          {/* Posts List */}
          <Box>
            {groupedPosts.length === 0 ? (
              <Paper sx={{ textAlign: 'center', py: 8, px: 4 }}>
                <Calendar size={64} color="#9CA3AF" style={{ marginBottom: 16 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1F2937', mb: 1 }}>
                  投稿がありません
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 500 }}>
                  フィルターを変更するか、新しい投稿を追加してください
                </Typography>
              </Paper>
            ) : (
              groupedPosts.map((group) => (
                <DateGroup key={group.date} displayLabel={group.displayLabel} count={group.count}>
                  {group.posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      isSelected={selectedPostId === post.id}
                      onClick={() => setSelectedPostId(post.id)}
                      onEdit={() => handleEdit(post)}
                      onRegenerate={() => regeneratePost(post.id)}
                      onDelete={() => deletePost(post.id)}
                      onApprove={post.status === 'unapproved' ? () => approvePost(post.id) : undefined}
                      onRetry={post.status === 'failed' ? () => retryPost(post.id) : undefined}
                    />
                  ))}
                </DateGroup>
              ))
            )}
          </Box>

          {/* Preview Panel (Sticky Right Side) */}
          <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
            <TweetPreviewPanel post={selectedPost} />
          </Box>
        </Box>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>投稿を編集</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="投稿内容"
              fullWidth
              multiline
              rows={6}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              helperText={`${editContent.length}/280文字`}
              error={editContent.length > 280}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="投稿予定日時"
              type="datetime-local"
              fullWidth
              value={editScheduledAt}
              onChange={(e) => setEditScheduledAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="投稿する日時を変更できます"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditDialogOpen(false)}>キャンセル</Button>
            <Button
              onClick={handleSaveEdit}
              variant="contained"
              disabled={editContent.length > 280}
              sx={{
                background: 'linear-gradient(135deg, #1DA1F2 0%, #0E7FC7 100%)',
                fontWeight: 600,
              }}
            >
              保存
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Manual Post Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>手動で投稿を追加</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              手動で投稿を作成し、指定した日時に予約投稿します。
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              label="投稿内容"
              fullWidth
              multiline
              rows={6}
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              helperText={`${newPostContent.length}/280文字`}
              error={newPostContent.length > 280}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="予約日時"
              type="datetime-local"
              fullWidth
              value={newPostScheduledAt}
              onChange={(e) => setNewPostScheduledAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCreateDialogOpen(false)} disabled={creating}>
              キャンセル
            </Button>
            <Button
              onClick={handleCreatePost}
              variant="contained"
              disabled={creating || newPostContent.length > 280 || !newPostContent.trim()}
              sx={{
                background: 'linear-gradient(135deg, #1DA1F2 0%, #0E7FC7 100%)',
                fontWeight: 600,
              }}
            >
              {creating ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : '投稿を作成'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </motion.div>
    </MainLayout>
  );
};

export default PostsPage;
