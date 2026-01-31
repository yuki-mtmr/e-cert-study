/**
 * 問題表示のE2Eテスト
 *
 * 認証が必要なため、実際のテストにはテスト用のログイン処理が必要
 */
import { test, expect } from '@playwright/test';

test.describe('問題表示', () => {
  test.skip('ログイン後に問題一覧が表示される', async ({ page }) => {
    // テスト用のログイン処理が必要
    await page.goto('/');

    // 問題一覧ページが表示されることを確認
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('ログインページでフォームバリデーションが機能する', async ({ page }) => {
    await page.goto('/login');

    // 空のフォームで送信
    await page.getByRole('button', { name: 'ログイン' }).click();

    // HTML5バリデーションが効くことを確認（requiredフィールド）
    const emailInput = page.getByLabel('メールアドレス');
    await expect(emailInput).toBeVisible();

    // inputが:invalidであることを確認（HTML5バリデーション）
    const isInvalid = await emailInput.evaluate(
      (el) => !(el as HTMLInputElement).validity.valid
    );
    expect(isInvalid).toBe(true);
  });
});
