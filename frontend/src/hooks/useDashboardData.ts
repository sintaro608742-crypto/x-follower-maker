import { useState, useEffect, useRef, useCallback } from 'react';
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

  // 連続クリック時のレースコンディション防止用ref
  const latestKeywordsRef = useRef<string[]>([]);

  // プリセットキーワードのラベル一覧
  const PRESET_KEYWORD_LABELS = [
    'ビジネス・起業',
    'プログラミング・技術',
    'デザイン・クリエイティブ',
    'マーケティング・SNS',
    '筋トレ・健康',
    '投資・副業'
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      logger.debug('Fetching dashboard data', { hookName: 'useDashboardData' });

      const result = await service.getDashboardData();

      // プリセットに存在しないキーワードをフィルタリング
      const filteredKeywords = (result.user.keywords || []).filter(
        keyword => PRESET_KEYWORD_LABELS.includes(keyword)
      );

      // フィルタリングされたキーワードでデータを更新
      const filteredResult = {
        ...result,
        user: {
          ...result.user,
          keywords: filteredKeywords
        }
      };

      setData(filteredResult);
      // refも同期
      latestKeywordsRef.current = filteredKeywords;

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

  const updateKeywords = useCallback(async (keywords: string[]): Promise<SettingsUpdateResponse> => {
    // 楽観的更新: refを即座に更新（クロージャ問題を回避）
    latestKeywordsRef.current = keywords;

    // setDataは関数型更新を使用してクロージャ問題を回避
    setData(prevData => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        user: {
          ...prevData.user,
          keywords
        }
      };
    });

    try {
      setUpdating(true);
      logger.debug('Updating keywords', { keywords, hookName: 'useDashboardData' });

      const request: KeywordUpdateRequest = { keywords };
      const response = await service.updateKeywords(request);

      // 成功時は楽観的更新が既に完了しているため、fetchDataは不要
      // 連続クリック時のレースコンディションを防ぐ

      logger.info('Keywords updated successfully', {
        hookName: 'useDashboardData',
        keywords
      });

      return response;
    } catch (err) {
      // エラー時は元の状態に戻すためデータを再取得
      await fetchData();

      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to update keywords', {
        error: error.message,
        hookName: 'useDashboardData'
      });
      throw error;
    } finally {
      setUpdating(false);
    }
  }, []);

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

  // キーワードトグル用関数（レースコンディション防止）
  const toggleKeyword = useCallback(async (keyword: string, maxSelection: number = 3): Promise<SettingsUpdateResponse | null> => {
    // 常にrefから最新のキーワードを取得（レースコンディション防止）
    const currentKeywords = latestKeywordsRef.current;
    let newKeywords: string[];

    if (currentKeywords.includes(keyword)) {
      // 選択解除
      newKeywords = currentKeywords.filter(k => k !== keyword);
    } else {
      // 新規選択（最大数チェック）
      if (currentKeywords.length >= maxSelection) {
        logger.warn('Maximum keywords reached', { current: currentKeywords.length, max: maxSelection });
        return null; // 最大数に達している場合はnullを返す
      }
      newKeywords = [...currentKeywords, keyword];
    }

    return updateKeywords(newKeywords);
  }, [updateKeywords]);

  return {
    data,
    loading,
    error,
    updating,
    refetch: fetchData,
    updateKeywords,
    toggleKeyword, // 新しいトグル関数
    updatePostSchedule,
    connectTwitter,
    disconnectTwitter,
    generatePosts
  };
};
