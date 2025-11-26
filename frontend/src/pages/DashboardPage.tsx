import { useState } from 'react';
import { Box, Typography, CircularProgress, Alert, Grid, Snackbar, Button, Paper, Slider, Dialog, DialogTitle, DialogContent, DialogActions, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { MainLayout } from '@/layouts/MainLayout';
import { motion } from 'framer-motion';
import { Clock, List, Sparkles } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  TwitterConnectionStatus,
  KeywordSelector,
  PostScheduleSettings,
  FollowerStatsCard,
  PostsList,
  CountdownTimer
} from '@/components/Dashboard';
import { logger } from '@/lib/logger';

export const DashboardPage = () => {
  const {
    data,
    loading,
    error,
    updating,
    toggleKeyword,
    updatePostSchedule,
    connectTwitter,
    disconnectTwitter,
    generatePosts
  } = useDashboardData();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateCount, setGenerateCount] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [generateTone, setGenerateTone] = useState<'casual' | 'professional' | 'humorous' | 'educational'>('casual');

  // トーンオプション定義
  const TONE_OPTIONS = [
    { value: 'casual', label: 'カジュアル', description: '親しみやすく気軽な雰囲気' },
    { value: 'professional', label: 'プロフェッショナル', description: '信頼感のある丁寧な表現' },
    { value: 'humorous', label: 'ユーモア', description: '面白く印象に残る内容' },
    { value: 'educational', label: '教育的', description: '役立つ情報を分かりやすく' },
  ] as const;

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleTwitterConnect = async () => {
    try {
      logger.debug('Twitter connect initiated', { component: 'DashboardPage' });
      const authUrl = await connectTwitter();
      // 実際のアプリでは、authUrlに遷移する
      window.location.href = authUrl;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Twitter connect failed', {
        error: error.message,
        component: 'DashboardPage'
      });
      showSnackbar('X連携に失敗しました', 'error');
    }
  };

  const handleTwitterDisconnect = async () => {
    if (!data?.user.id) return;

    try {
      logger.debug('Twitter disconnect initiated', { component: 'DashboardPage' });
      const response = await disconnectTwitter(data.user.id);
      showSnackbar(response.message, 'success');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Twitter disconnect failed', {
        error: error.message,
        component: 'DashboardPage'
      });
      showSnackbar('X連携解除に失敗しました', 'error');
    }
  };

  const handleKeywordToggle = async (keyword: string) => {
    try {
      logger.debug('Toggling keyword', { keyword, component: 'DashboardPage' });

      // toggleKeywordはrefを使って最新の状態を取得するため、レースコンディションを防ぐ
      const response = await toggleKeyword(keyword, 3);

      if (response === null) {
        // 最大数に達している場合
        showSnackbar('キーワードは最大3つまで選択できます', 'error');
        return;
      }

      showSnackbar(response.message, 'success');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Keyword update failed', {
        error: error.message,
        component: 'DashboardPage'
      });
      showSnackbar('キーワード更新に失敗しました', 'error');
    }
  };

  const handleFrequencyChange = async (frequency: number) => {
    if (!data?.user.post_times) return;

    try {
      logger.debug('Updating post frequency', { frequency, component: 'DashboardPage' });
      const response = await updatePostSchedule(frequency, data.user.post_times);
      showSnackbar(response.message, 'success');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Frequency update failed', {
        error: error.message,
        component: 'DashboardPage'
      });
      showSnackbar('投稿頻度の更新に失敗しました', 'error');
    }
  };

  const handlePostTimesChange = async (times: string[]) => {
    if (!data?.user.post_frequency) return;

    try {
      logger.debug('Updating post times', { times, component: 'DashboardPage' });
      const response = await updatePostSchedule(data.user.post_frequency, times);
      showSnackbar(response.message, 'success');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Post times update failed', {
        error: error.message,
        component: 'DashboardPage'
      });
      showSnackbar('投稿時間帯の更新に失敗しました', 'error');
    }
  };

  const handleOpenGenerateDialog = () => {
    setGenerateDialogOpen(true);
  };

  const handleCloseGenerateDialog = () => {
    setGenerateDialogOpen(false);
  };

  const handleGeneratePosts = async () => {
    try {
      setGenerating(true);
      logger.debug('Generating posts with AI', { count: generateCount, tone: generateTone, component: 'DashboardPage' });

      const response = await generatePosts(generateCount, generateTone);

      showSnackbar(response.message, 'success');
      setGenerateDialogOpen(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Post generation failed', {
        error: error.message,
        component: 'DashboardPage'
      });
      showSnackbar(error.message || 'AI投稿生成に失敗しました', 'error');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error.message}
        </Alert>
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout>
        <Alert severity="warning" sx={{ mt: 2 }}>
          データを読み込めませんでした
        </Alert>
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
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 800,
              mb: 1,
              background: 'linear-gradient(135deg, #1DA1F2 0%, #0E7FC7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            ダッシュボード
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            X自動投稿とフォロワー増加を管理
          </Typography>
        </Box>

        {/* Grid Layout */}
        <Grid container spacing={3.5}>
          {/* Twitter Connection Status */}
          <Grid size={{ xs: 12 }}>
            <TwitterConnectionStatus
              status={data.twitterStatus}
              username={data.user.twitter_username}
              onConnect={handleTwitterConnect}
              onDisconnect={handleTwitterDisconnect}
            />
          </Grid>

          {/* Keywords Selector */}
          <Grid size={{ xs: 12, md: 6 }}>
            <KeywordSelector
              selectedKeywords={data.user.keywords}
              onKeywordToggle={handleKeywordToggle}
            />

            {/* AI Generate Posts Section */}
            <Paper
              sx={{
                mt: 2,
                p: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="h6"
                  sx={{ color: '#FFFFFF', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Sparkles size={24} />
                  AI投稿を生成
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
                  選択したキーワードに基づいてAIが魅力的なツイートを自動生成
                </Typography>
              </Box>

              {/* Tone Selection */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, mb: 1 }}>
                  トーン・スタイル
                </Typography>
                <ToggleButtonGroup
                  value={generateTone}
                  exclusive
                  onChange={(_, value) => value && setGenerateTone(value)}
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 0.5,
                    '& .MuiToggleButton-root': {
                      flex: '1 1 calc(50% - 4px)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '8px !important',
                      py: 1,
                      px: 1.5,
                      textTransform: 'none',
                      color: 'rgba(255,255,255,0.8)',
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderColor: 'rgba(255,255,255,0.8)',
                        color: '#FFFFFF',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.25)',
                        },
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)',
                      },
                    },
                  }}
                >
                  {TONE_OPTIONS.map((option) => (
                    <ToggleButton key={option.value} value={option.value}>
                      <Box sx={{ textAlign: 'left', width: '100%' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                          {option.label}
                        </Typography>
                      </Box>
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              {/* Generate Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={handleOpenGenerateDialog}
                  disabled={!data.user.keywords || data.user.keywords.length === 0 || generating}
                  sx={{
                    background: '#FFFFFF',
                    color: '#667eea',
                    fontWeight: 700,
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    '&:hover': {
                      background: '#F8F9FA',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    },
                    '&:disabled': {
                      background: 'rgba(255,255,255,0.5)',
                      color: 'rgba(102, 126, 234, 0.5)',
                    },
                  }}
                >
                  {generating ? <CircularProgress size={20} sx={{ color: '#667eea' }} /> : '生成する'}
                </Button>
              </Box>
              {(!data.user.keywords || data.user.keywords.length === 0) && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', mt: 1 }}>
                  ※ キーワードを1つ以上選択してください
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Post Schedule Settings */}
          <Grid size={{ xs: 12, md: 6 }}>
            <PostScheduleSettings
              frequency={data.user.post_frequency}
              postTimes={data.user.post_times}
              onFrequencyChange={handleFrequencyChange}
              onPostTimesChange={handlePostTimesChange}
            />
          </Grid>

          {/* Follower Stats */}
          <Grid size={{ xs: 12 }}>
            <FollowerStatsCard stats={data.followerStats} />
          </Grid>

          {/* Today's Posts Schedule */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box>
              <PostsList
                title="今日の投稿予定"
                posts={data.todayPosts}
                icon={<Clock size={20} />}
                showEngagement={false}
              />
              <CountdownTimer initialCountdown={data.nextPostCountdown} />
            </Box>
          </Grid>

          {/* Recent Posts History */}
          <Grid size={{ xs: 12, md: 6 }}>
            <PostsList
              title="最近の投稿履歴"
              posts={data.recentPosts}
              icon={<List size={20} />}
              showEngagement={true}
            />
          </Grid>
        </Grid>

        {/* Loading Overlay */}
        {updating && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.7)',
              zIndex: 9999
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {/* AI Generate Dialog */}
        <Dialog
          open={generateDialogOpen}
          onClose={handleCloseGenerateDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              p: 1,
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Sparkles size={24} color="#667eea" />
            AI投稿を生成
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              選択したキーワードに基づいて、AIが魅力的なツイートを自動生成します。
              生成された投稿は「承認待ち」状態で作成されます。
            </Typography>
            <Box sx={{ px: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                生成件数: {generateCount}件
              </Typography>
              <Slider
                value={generateCount}
                onChange={(_, value) => setGenerateCount(value as number)}
                min={1}
                max={5}
                step={1}
                marks={[
                  { value: 1, label: '1件' },
                  { value: 3, label: '3件' },
                  { value: 5, label: '5件' },
                ]}
                sx={{
                  color: '#667eea',
                  '& .MuiSlider-thumb': {
                    backgroundColor: '#667eea',
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: '#667eea',
                  },
                }}
              />
            </Box>
            {/* Selected Tone Display */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">
                選択中のトーン: <strong>{TONE_OPTIONS.find(t => t.value === generateTone)?.label}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {TONE_OPTIONS.find(t => t.value === generateTone)?.description}
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              生成には数秒かかる場合があります。生成された投稿は「投稿管理」ページで確認・編集できます。
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseGenerateDialog} color="inherit">
              キャンセル
            </Button>
            <Button
              onClick={handleGeneratePosts}
              variant="contained"
              disabled={generating}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontWeight: 600,
                px: 3,
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
                },
              }}
            >
              {generating ? (
                <>
                  <CircularProgress size={20} sx={{ color: '#fff', mr: 1 }} />
                  生成中...
                </>
              ) : (
                `${generateCount}件生成する`
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
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

export default DashboardPage;
