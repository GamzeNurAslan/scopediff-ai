import pandas as pd
import pytest

from backend.app.comparison.change_detector import (
    RequirementChangeDetector,
)


class FakeMatcher:
    """
    ChangeDetector testlerini gerçek TF-IDF veya
    Sentence Transformer modeline bağlamadan test eder.
    """

    def fit(
        self,
        candidate_dataframe: pd.DataFrame,
    ):
        self.candidate_dataframe = candidate_dataframe
        return self

    def match_dataframe(
        self,
        source_dataframe: pd.DataFrame,
        top_k: int = 5,
        min_score: float = 0.0,
    ) -> pd.DataFrame:

        scores = {
            "REQ-001": (
                "REQ-001",
                1.00,
            ),
            "REQ-002": (
                "REQ-002",
                0.92,
            ),
            "REQ-003": (
                "REQ-003",
                0.72,
            ),
            "REQ-004": (
                "REQ-005",
                0.20,
            ),
        }

        rows = []

        for _, row in source_dataframe.iterrows():

            source_id = row[
                "requirement_id"
            ]

            if source_id not in scores:
                continue

            candidate_id, score = (
                scores[source_id]
            )

            rows.append(
                {
                    "source_requirement_id":
                        source_id,
                    "candidate_requirement_id":
                        candidate_id,
                    "similarity_score":
                        score,
                }
            )

        return pd.DataFrame(rows)


def create_old_dataframe() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "requirement_id": [
                "REQ-001",
                "REQ-002",
                "REQ-003",
                "REQ-004",
            ],
            "requirement_text": [
                (
                    "Müşteri kimliği "
                    "doğrulanmalıdır."
                ),
                (
                    "Aktivasyon tamamlandığında "
                    "müşteriye SMS gönderilmelidir."
                ),
                (
                    "Port kontrolü en fazla "
                    "3 kez yapılmalıdır."
                ),
                (
                    "Eski kayıt "
                    "arşivlenmelidir."
                ),
            ],
        }
    )


def create_new_dataframe() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "requirement_id": [
                "REQ-001",
                "REQ-002",
                "REQ-003",
                "REQ-005",
            ],
            "requirement_text": [
                (
                    "Müşteri kimliği "
                    "doğrulanmalıdır."
                ),
                (
                    "Hizmet aktif olduğunda "
                    "kullanıcı kısa mesajla "
                    "bilgilendirilmelidir."
                ),
                (
                    "Port kontrolü en fazla "
                    "5 kez yapılmalıdır."
                ),
                (
                    "Yeni sipariş için "
                    "bildirim oluşturulmalıdır."
                ),
            ],
        }
    )


def create_detector() -> RequirementChangeDetector:
    return RequirementChangeDetector(
        matcher=FakeMatcher(),
        changed_threshold=0.45,
        paraphrase_threshold=0.80,
    )


def test_unchanged_requirement_is_detected() -> None:
    detector = create_detector()

    result = detector.compare(
        create_old_dataframe(),
        create_new_dataframe(),
    )

    row = result[
        result["old_requirement_id"]
        == "REQ-001"
    ].iloc[0]

    assert row["change_type"] == "unchanged"


def test_paraphrased_requirement_is_detected() -> None:
    detector = create_detector()

    result = detector.compare(
        create_old_dataframe(),
        create_new_dataframe(),
    )

    row = result[
        result["old_requirement_id"]
        == "REQ-002"
    ].iloc[0]

    assert row["change_type"] == "paraphrased"


def test_changed_requirement_is_detected() -> None:
    detector = create_detector()

    result = detector.compare(
        create_old_dataframe(),
        create_new_dataframe(),
    )

    row = result[
        result["old_requirement_id"]
        == "REQ-003"
    ].iloc[0]

    assert row["change_type"] == "changed"


def test_removed_requirement_is_detected() -> None:
    detector = create_detector()

    result = detector.compare(
        create_old_dataframe(),
        create_new_dataframe(),
    )

    row = result[
        result["old_requirement_id"]
        == "REQ-004"
    ].iloc[0]

    assert row["change_type"] == "removed"
    assert pd.isna(row["new_requirement_id"])


def test_added_requirement_is_detected() -> None:
    detector = create_detector()

    result = detector.compare(
        create_old_dataframe(),
        create_new_dataframe(),
    )

    row = result[
        result["new_requirement_id"]
        == "REQ-005"
    ].iloc[0]

    assert row["change_type"] == "added"
    assert pd.isna(row["old_requirement_id"])


def test_invalid_thresholds_raise_error() -> None:
    with pytest.raises(ValueError):
        RequirementChangeDetector(
            matcher=FakeMatcher(),
            changed_threshold=0.90,
            paraphrase_threshold=0.70,
        )