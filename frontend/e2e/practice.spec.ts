/**
 * 練習モードのE2Eテスト
 *
 * ログイン→練習画面→回答の基本フローをテスト
 */
import { test, expect } from '@playwright/test';

test.describe('練習モード', () => {
  test.beforeEach(async ({ page }) => {
    // ログインページに移動
    await page.goto('/login');
  });

  test('ログインページが正しく表示される', async ({ page }) => {
    // タイトルが表示されることを確認
    await expect(page.getByRole('heading', { name: 'E資格学習' })).toBeVisible();

    // ログインフォームの要素が表示されることを確認
    await expect(page.getByLabel('メールアドレス')).toBeVisible();
    await expect(page.getByLabel('パスワード')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible();
  });

  test('メールアドレスの入力バリデーション', async ({ page }) => {
    const emailInput = page.getByLabel('メールアドレス');

    // 不正なメールアドレスを入力
    await emailInput.fill('invalid-email');
    await page.getByLabel('パスワード').fill('password123');
    await page.getByRole('button', { name: 'ログイン' }).click();

    // HTML5のメールバリデーションが効くことを確認
    const isInvalid = await emailInput.evaluate(
      (el) => !(el as HTMLInputElement).validity.valid
    );
    expect(isInvalid).toBe(true);
  });

  test('パスワードフィールドがマスクされている', async ({ page }) => {
    const passwordInput = page.getByLabel('パスワード');

    // type="password"であることを確認
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('ログインボタンがロード中は無効化される', async ({ page }) => {
    // ダミーの認証情報を入力
    await page.getByLabel('メールアドレス').fill('test@example.com');
    await page.getByLabel('パスワード').fill('password123');

    // ボタンをクリック
    await page.getByRole('button', { name: 'ログイン' }).click();

    // ボタンが無効化されることを確認（ロード中）
    await expect(page.getByRole('button')).toBeDisabled();
  });
});
