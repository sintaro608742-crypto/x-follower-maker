/**
 * Dashboard API Integration Test
 *
 * このファイルはGET /api/dashboardエンドポイントの統合テストです。
 * 実際のデータベースを使用してAPIの動作を検証します。
 */

import { getDashboardData } from '@/services/dashboard.service';
import {
  createTestUser,
  createTestPost,
  createTestFollowerStats,
  deleteTestUser,
} from '../../utils/db-test-helper';

describe('GET /api/dashboard - Dashboard API Integration Tests', () => {
  let testUserId: string;

  beforeEach(async () => {
    // 各テストの前にテストユーザーを作成
    testUserId = await createTestUser();
  });

  afterEach(async () => {
    // 各テストの後にテストデータをクリーンアップ
    if (testUserId) {
      await deleteTestUser(testUserId);
    }
  });

  describe('正常系テスト', () => {
    it('ダッシュボードデータを正常に取得できる', async () => {
      // テストデータの準備
      const today = new Date();
      today.setHours(12, 0, 0, 0);

      await createTestPost(testUserId, today, 'scheduled');
      await createTestFollowerStats(testUserId, 100, new Date());

      // サービス層を直接テスト（APIルート経由ではなく）
      const result = await getDashboardData(testUserId);

      // 検証
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(testUserId);
      expect(result.twitterStatus).toBe('disconnected');
      expect(result.followerStats).toBeDefined();
      expect(result.followerStats.currentCount).toBe(100);
      expect(result.todayPosts).toBeDefined();
      expect(Array.isArray(result.todayPosts)).toBe(true);
      expect(result.recentPosts).toBeDefined();
      expect(Array.isArray(result.recentPosts)).toBe(true);
      expect(result.nextPostCountdown).toBeDefined();
    });

    it('今日の投稿予定を正しく取得できる', async () => {
      // テストデータの準備
      const today = new Date();
      today.setHours(10, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      await createTestPost(testUserId, today, 'scheduled');
      await createTestPost(testUserId, tomorrow, 'scheduled');

      // サービス層を直接テスト
      const result = await getDashboardData(testUserId);

      // 検証
      expect(result.todayPosts.length).toBeGreaterThanOrEqual(1);
      expect(result.todayPosts[0].status).toBe('scheduled');
    });

    it('最近の投稿履歴を正しく取得できる（最大10件）', async () => {
      // テストデータの準備
      const now = new Date();

      for (let i = 0; i < 12; i++) {
        const postTime = new Date(now);
        postTime.setHours(now.getHours() - i);
        await createTestPost(testUserId, postTime, 'posted');
      }

      // サービス層を直接テスト
      const result = await getDashboardData(testUserId);

      // 検証
      expect(result.recentPosts.length).toBeLessThanOrEqual(10);
      result.recentPosts.forEach((post) => {
        expect(post.status).toBe('posted');
      });
    });

    it('フォロワー統計の成長率を正しく計算できる', async () => {
      // テストデータの準備
      const now = new Date();
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      await createTestFollowerStats(testUserId, 100, twoDaysAgo);
      await createTestFollowerStats(testUserId, 110, now);

      // サービス層を直接テスト
      const result = await getDashboardData(testUserId);

      // 検証
      expect(result.followerStats.currentCount).toBe(110);
      expect(result.followerStats.previousCount).toBe(100);
      expect(result.followerStats.growthCount).toBe(10);
      expect(result.followerStats.growthRate).toBe(10);
    });

    it('次回投稿までのカウントダウンを正しく計算できる', async () => {
      // テストデータの準備
      const futureTime = new Date();
      futureTime.setHours(futureTime.getHours() + 3);
      futureTime.setMinutes(30);
      futureTime.setSeconds(0);

      await createTestPost(testUserId, futureTime, 'scheduled');

      // サービス層を直接テスト
      const result = await getDashboardData(testUserId);

      // 検証
      expect(result.nextPostCountdown).toBeDefined();
      expect(result.nextPostCountdown.hours).toBeGreaterThanOrEqual(2);
      expect(result.nextPostCountdown.minutes).toBeGreaterThanOrEqual(0);
      expect(result.nextPostCountdown.seconds).toBeGreaterThanOrEqual(0);
    });
  });

  describe('エッジケーステスト', () => {
    it('投稿予定がない場合でも正常に動作する', async () => {
      // 投稿データなし
      await createTestFollowerStats(testUserId, 50, new Date());

      // サービス層を直接テスト
      const result = await getDashboardData(testUserId);

      // 検証
      expect(result.todayPosts).toEqual([]);
      expect(result.recentPosts).toEqual([]);
      expect(result.nextPostCountdown.hours).toBe(0);
      expect(result.nextPostCountdown.minutes).toBe(0);
      expect(result.nextPostCountdown.seconds).toBe(0);
    });

    it('フォロワー統計がない場合でも正常に動作する', async () => {
      // フォロワー統計データなし
      const today = new Date();
      await createTestPost(testUserId, today, 'scheduled');

      // サービス層を直接テスト
      const result = await getDashboardData(testUserId);

      // 検証
      expect(result.followerStats.currentCount).toBe(0);
      expect(result.followerStats.previousCount).toBe(0);
      expect(result.followerStats.growthCount).toBe(0);
      expect(result.followerStats.growthRate).toBe(0);
    });
  });

  describe('データ整合性テスト', () => {
    it('ユーザーの設定情報が正しく含まれている', async () => {
      // サービス層を直接テスト
      const result = await getDashboardData(testUserId);

      // 検証
      expect(result.user.keywords).toEqual(['テスト', 'プログラミング']);
      expect(result.user.post_frequency).toBe(4);
      expect(result.user.post_times).toEqual(['09:00', '12:00', '18:00', '21:00']);
    });

    it('投稿データのタイムスタンプがISO8601形式である', async () => {
      // テストデータの準備
      const today = new Date();
      await createTestPost(testUserId, today, 'scheduled');

      // サービス層を直接テスト
      const result = await getDashboardData(testUserId);

      // 検証
      expect(result.todayPosts[0].scheduled_at).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
      expect(result.todayPosts[0].created_at).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });
  });
});
