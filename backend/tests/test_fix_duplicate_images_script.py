"""重複画像修正スクリプトのテスト"""
import uuid

import pytest

from scripts.fix_duplicate_images import find_duplicates, deduplicate_records


class FakeImageRecord:
    """テスト用のQuestionImageレコード"""

    def __init__(
        self,
        record_id: uuid.UUID,
        question_id: uuid.UUID,
        file_path: str,
    ):
        self.id = record_id
        self.question_id = question_id
        self.file_path = file_path


class TestFindDuplicates:
    """重複検出テスト"""

    def test_no_duplicates(self):
        """重複なしの場合は空リスト"""
        records = [
            FakeImageRecord(uuid.uuid4(), uuid.uuid4(), "/path/a.png"),
            FakeImageRecord(uuid.uuid4(), uuid.uuid4(), "/path/b.png"),
        ]
        result = find_duplicates(records)
        assert len(result) == 0

    def test_finds_duplicates(self):
        """同一question_id + file_pathの重複を検出"""
        q_id = uuid.uuid4()
        r1 = FakeImageRecord(uuid.uuid4(), q_id, "/path/a.png")
        r2 = FakeImageRecord(uuid.uuid4(), q_id, "/path/a.png")
        r3 = FakeImageRecord(uuid.uuid4(), q_id, "/path/b.png")
        records = [r1, r2, r3]
        result = find_duplicates(records)
        # 重複ペアのうち後のもの（r2）が削除対象
        assert len(result) == 1
        assert result[0].id == r2.id

    def test_multiple_duplicates(self):
        """3つ以上の重複がある場合、最初の1つだけ残す"""
        q_id = uuid.uuid4()
        r1 = FakeImageRecord(uuid.uuid4(), q_id, "/path/a.png")
        r2 = FakeImageRecord(uuid.uuid4(), q_id, "/path/a.png")
        r3 = FakeImageRecord(uuid.uuid4(), q_id, "/path/a.png")
        records = [r1, r2, r3]
        result = find_duplicates(records)
        assert len(result) == 2
        assert r1.id not in [r.id for r in result]

    def test_different_questions_not_duplicates(self):
        """異なるquestion_idの同一file_pathは重複ではない"""
        r1 = FakeImageRecord(uuid.uuid4(), uuid.uuid4(), "/path/a.png")
        r2 = FakeImageRecord(uuid.uuid4(), uuid.uuid4(), "/path/a.png")
        records = [r1, r2]
        result = find_duplicates(records)
        assert len(result) == 0


class TestDeduplicateRecords:
    """重複除去テスト"""

    def test_dedup_returns_ids_to_delete(self):
        """削除対象のIDリストを返す"""
        q_id = uuid.uuid4()
        r1 = FakeImageRecord(uuid.uuid4(), q_id, "/path/a.png")
        r2 = FakeImageRecord(uuid.uuid4(), q_id, "/path/a.png")
        records = [r1, r2]
        ids_to_delete = deduplicate_records(records, dry_run=True)
        assert len(ids_to_delete) == 1
        assert ids_to_delete[0] == r2.id

    def test_dedup_dry_run_no_side_effect(self):
        """dry_run=Trueでは副作用なし（レコードは削除されない）"""
        q_id = uuid.uuid4()
        r1 = FakeImageRecord(uuid.uuid4(), q_id, "/path/a.png")
        r2 = FakeImageRecord(uuid.uuid4(), q_id, "/path/a.png")
        records = [r1, r2]
        ids = deduplicate_records(records, dry_run=True)
        assert len(ids) == 1
        # recordsリスト自体は変更されない
        assert len(records) == 2
