import { test, expect } from '@playwright/test';
import testUsers from '../fixtures/test-users.json';

test.describe('ログイン機能', () => {
  test('ログインページが正しく表示される', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/frontend/);
    await expect(page.locator('text=Xフォロワーメーカー')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('デモユーザーでログインできる', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers.demoUser.email);
    await page.fill('input[name="password"]', testUsers.demoUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 5000 });
    await expect(page).toHaveURL('/dashboard');
  });

  test('無効な認証情報でログインエラーが表示される', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    // エラーメッセージの確認（Snackbar等）
    await expect(page.locator('text=/ログインに失敗|エラー|正しくありません/')).toBeVisible({ timeout: 5000 });
  });
});
