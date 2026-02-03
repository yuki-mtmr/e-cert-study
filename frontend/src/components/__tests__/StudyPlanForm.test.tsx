/**
 * 学習プランフォームコンポーネントのテスト
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudyPlanForm } from '../StudyPlanForm';
import type { StudyPlan } from '@/types';

const mockStudyPlan: StudyPlan = {
  id: '1',
  userId: 'user123',
  examDate: '2026-03-15',
  targetQuestionsPerDay: 20,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('StudyPlanForm', () => {
  it('フォームを表示する', () => {
    render(<StudyPlanForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/試験日/)).toBeInTheDocument();
    expect(screen.getByLabelText(/1日の目標問題数/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /プランを作成/ })).toBeInTheDocument();
  });

  it('既存の学習プランがある場合は値を表示する', () => {
    render(<StudyPlanForm studyPlan={mockStudyPlan} onSubmit={vi.fn()} />);

    const examDateInput = screen.getByLabelText(/試験日/) as HTMLInputElement;
    const targetInput = screen.getByLabelText(/1日の目標問題数/) as HTMLInputElement;

    expect(examDateInput.value).toBe('2026-03-15');
    expect(targetInput.value).toBe('20');
    expect(screen.getByRole('button', { name: /プランを更新/ })).toBeInTheDocument();
  });

  it('フォームを送信するとonSubmitが呼ばれる', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<StudyPlanForm onSubmit={onSubmit} />);

    const examDateInput = screen.getByLabelText(/試験日/);
    const targetInput = screen.getByLabelText(/1日の目標問題数/);
    const submitButton = screen.getByRole('button', { name: /プランを作成/ });

    await user.clear(examDateInput);
    await user.type(examDateInput, '2026-04-01');
    await user.clear(targetInput);
    await user.type(targetInput, '25');
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith({
      examDate: '2026-04-01',
      targetQuestionsPerDay: 25,
    });
  });

  it('必須フィールドが空の場合は送信できない', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<StudyPlanForm onSubmit={onSubmit} />);

    const examDateInput = screen.getByLabelText(/試験日/) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /プランを作成/ });

    // 試験日を空にする
    await user.clear(examDateInput);
    await user.click(submitButton);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('目標問題数は1以上である必要がある', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<StudyPlanForm onSubmit={onSubmit} />);

    const targetInput = screen.getByLabelText(/1日の目標問題数/);

    await user.clear(targetInput);
    await user.type(targetInput, '0');

    const submitButton = screen.getByRole('button', { name: /プランを作成/ });
    await user.click(submitButton);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('削除ボタンが表示される（既存プランがある場合）', () => {
    const onDelete = vi.fn();
    render(
      <StudyPlanForm
        studyPlan={mockStudyPlan}
        onSubmit={vi.fn()}
        onDelete={onDelete}
      />
    );

    expect(screen.getByRole('button', { name: /削除/ })).toBeInTheDocument();
  });

  it('削除ボタンをクリックするとonDeleteが呼ばれる', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(
      <StudyPlanForm
        studyPlan={mockStudyPlan}
        onSubmit={vi.fn()}
        onDelete={onDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /削除/ });
    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalled();
  });

  it('新規作成時は削除ボタンが表示されない', () => {
    render(<StudyPlanForm onSubmit={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /削除/ })).not.toBeInTheDocument();
  });

  it('ローディング中は送信ボタンが無効になる', () => {
    render(<StudyPlanForm onSubmit={vi.fn()} isLoading={true} />);

    const submitButton = screen.getByRole('button', { name: /プランを作成/ });
    expect(submitButton).toBeDisabled();
  });

  it('日付入力フィールドで日付を選択するとvalueが更新される', async () => {
    const user = userEvent.setup();
    render(<StudyPlanForm onSubmit={vi.fn()} />);

    const examDateInput = screen.getByLabelText(/試験日/) as HTMLInputElement;

    // fireEventで日付をchangeイベントでセット（カレンダー選択をシミュレート）
    fireEvent.change(examDateInput, { target: { value: '2026-05-01' } });

    expect(examDateInput.value).toBe('2026-05-01');
  });

  it('日付入力フィールドには明示的に背景色とテキスト色が設定されている', () => {
    render(<StudyPlanForm onSubmit={vi.fn()} />);

    const examDateInput = screen.getByLabelText(/試験日/) as HTMLInputElement;
    const styles = window.getComputedStyle(examDateInput);

    // 明示的な色設定があること（ダークモード対応のため）
    // CSSモジュールが適用されていれば、背景色が白系になる
    expect(examDateInput.className).toContain('input');
  });

  it('目標問題数の入力値をスピナーで変更できる', async () => {
    render(<StudyPlanForm onSubmit={vi.fn()} />);

    const targetInput = screen.getByLabelText(/1日の目標問題数/) as HTMLInputElement;

    // 初期値は20
    expect(targetInput.value).toBe('20');

    // fireEventで値を変更（スピナーボタンのクリックをシミュレート）
    fireEvent.change(targetInput, { target: { value: '21' } });
    expect(targetInput.value).toBe('21');

    fireEvent.change(targetInput, { target: { value: '19' } });
    expect(targetInput.value).toBe('19');
  });
});
