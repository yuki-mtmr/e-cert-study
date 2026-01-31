/**
 * 認証フローのE2Eテスト
 */
import { test, expect } from '@playwright/test';

test.describe('認証フロー', () => {
  test('未認証ユーザーはログインページにリダイレクトされる', async ({ page }) => {
    await page.goto('/');

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/login/);

    // ログインフォームが表示されることを確認
    await expect(page.getByRole('heading', { name: 'E資格学習' })).toBeVisible();
    await expect(page.getByLabel('メールアドレス')).toBeVisible();
    await expect(page.getByLabel('パスワード')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible();
  });

  test('無効な認証情報でエラーが表示される', async ({ page }) => {
    await page.goto('/login');

    // 無効な認証情報を入力
    await page.getByLabel('メールアドレス').fill('invalid@example.com');
    await page.getByLabel('パスワード').fill('wrongpassword');
    await page.getByRole('button', { name: 'ログイン' }).click();

    // エラーメッセージが表示されることを確認
    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 10000 });
  });
});
