import { useState } from 'react';
import { Box, Typography, CircularProgress, Alert, Grid, Snackbar } from '@mui/material';
import { MainLayout } from '@/layouts/MainLayout';
import { motion } from 'framer-motion';
import { Clock, List } from 'lucide-react';
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
    updateKeywords,
    updatePostSchedule,
    connectTwitter,
    disconnectTwitter
  } = useDashboardData();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

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
    if (!data?.user.keywords) return;

    const currentKeywords = data.user.keywords;
    let newKeywords: string[];

    if (currentKeywords.includes(keyword)) {
      newKeywords = currentKeywords.filter(k => k !== keyword);
    } else {
      if (currentKeywords.length >= 3) {
        showSnackbar('キーワードは最大3つまで選択できます', 'error');
        return;
      }
      newKeywords = [...currentKeywords, keyword];
    }

    try {
      logger.debug('Updating keywords', { keywords: newKeywords, component: 'DashboardPage' });
      const response = await updateKeywords(newKeywords);
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
