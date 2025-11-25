import { useState, useEffect } from 'react';
import { DashboardService } from '@/services/api/DashboardService';
import type { GeneratePostsResponse } from '@/services/api/DashboardService';
import type {
  DashboardData,
  KeywordUpdateRequest,
  PostScheduleUpdateRequest,
  TwitterDisconnectRequest,
  SettingsUpdateResponse
} from '@/types';
import { logger } from '@/lib/logger';

const service = new DashboardService();

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      logger.debug('Fetching dashboard data', { hookName: 'useDashboardData' });

      const result = await service.getDashboardData();
      setData(result);

      logger.info('Dashboard data fetched successfully', {
        hookName: 'useDashboardData',
        twitterStatus: result.twitterStatus
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to fetch dashboard data', {
        error: error.message,
        hookName: 'useDashboardData'
      });
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    logger.debug('Hook mounted', { hookName: 'useDashboardData' });
    fetchData();
  }, []);

  const updateKeywords = async (keywords: string[]): Promise<SettingsUpdateResponse> => {
    try {
      setUpdating(true);
      logger.debug('Updating keywords', { keywords, hookName: 'useDashboardData' });

      const request: KeywordUpdateRequest = { keywords };
      const response = await service.updateKeywords(request);

      // データを再取得
      await fetchData();

      logger.info('Keywords updated successfully', {
        hookName: 'useDashboardData',
        keywords
      });

      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to update keywords', {
        error: error.message,
        hookName: 'useDashboardData'
      });
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  const updatePostSchedule = async (
    frequency: number,
    times: string[]
  ): Promise<SettingsUpdateResponse> => {
    try {
      setUpdating(true);
      logger.debug('Updating post schedule', {
        frequency,
        times,
        hookName: 'useDashboardData'
      });

      const request: PostScheduleUpdateRequest = {
        post_frequency: frequency,
        post_times: times
      };
      const response = await service.updatePostSchedule(request);

      // データを再取得
      await fetchData();

      logger.info('Post schedule updated successfully', {
        hookName: 'useDashboardData',
        frequency,
        times
      });

      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to update post schedule', {
        error: error.message,
        hookName: 'useDashboardData'
      });
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  const connectTwitter = async (): Promise<string> => {
    try {
      logger.debug('Initiating Twitter connection', { hookName: 'useDashboardData' });

      const { authUrl } = await service.connectTwitter();

      logger.info('Twitter auth URL retrieved', {
        hookName: 'useDashboardData'
      });

      return authUrl;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to get Twitter auth URL', {
        error: error.message,
        hookName: 'useDashboardData'
      });
      throw error;
    }
  };

  const disconnectTwitter = async (userId: string): Promise<SettingsUpdateResponse> => {
    try {
      setUpdating(true);
      logger.debug('Disconnecting Twitter', { userId, hookName: 'useDashboardData' });

      const request: TwitterDisconnectRequest = { user_id: userId };
      const response = await service.disconnectTwitter(request);

      // データを再取得
      await fetchData();

      logger.info('Twitter disconnected successfully', {
        hookName: 'useDashboardData',
        userId
      });

      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to disconnect Twitter', {
        error: error.message,
        hookName: 'useDashboardData'
      });
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  const generatePosts = async (count: number = 1): Promise<GeneratePostsResponse> => {
    try {
      setUpdating(true);
      logger.debug('Generating posts with AI', { count, hookName: 'useDashboardData' });

      const response = await service.generatePosts(count);

      // データを再取得して投稿リストを更新
      await fetchData();

      logger.info('Posts generated successfully', {
        hookName: 'useDashboardData',
        count: response.posts.length
      });

      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to generate posts', {
        error: error.message,
        hookName: 'useDashboardData'
      });
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  return {
    data,
    loading,
    error,
    updating,
    refetch: fetchData,
    updateKeywords,
    updatePostSchedule,
    connectTwitter,
    disconnectTwitter,
    generatePosts
  };
};
