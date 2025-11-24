import { Page } from '@playwright/test';

export async function login(
  page: Page,
  email: string = 'demo@example.com',
  password: string = 'demo123'
) {
  await page.goto('/login');

  // MUI TextFieldはlabelで識別する
  await page.getByLabel(/メールアドレス|email/i).fill(email);
  await page.getByLabel(/パスワード|password/i).fill(password);

  // ログインボタンをクリック
  await page.getByRole('button', { name: /ログイン(?!中)/ }).click();

  // ダッシュボードに遷移するまで待機
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

export async function logout(page: Page) {
  await page.click('[aria-label="user menu"]');
  await page.click('text=ログアウト');
  await page.waitForURL('/login', { timeout: 5000 });
}
