"""模試設定"""

PASSING_THRESHOLD = 65.0
TIME_LIMIT_MINUTES = 120
TOTAL_QUESTIONS = 100

EXAM_AREAS: dict[str, dict] = {
    "応用数学": {"db_category": "応用数学", "question_count": 10},
    "機械学習": {"db_category": "機械学習", "question_count": 25},
    "深層学習の基礎": {"db_category": "深層学習の基礎", "question_count": 30},
    "深層学習の応用": {"db_category": "深層学習の応用", "question_count": 25},
    "開発・運用環境": {"db_category": "開発・運用環境", "question_count": 10},
}


def get_grade(accuracy: float) -> str:
    """正答率からグレードを判定

    Args:
        accuracy: 正答率（0.0〜100.0）

    Returns:
        S/A/B/C/D/F のグレード
    """
    if accuracy >= 90.0:
        return "S"
    if accuracy >= 80.0:
        return "A"
    if accuracy >= 65.0:
        return "B"
    if accuracy >= 50.0:
        return "C"
    if accuracy >= 30.0:
        return "D"
    return "F"
