import pandas as pd

from backend.app.pipeline.analysis_pipeline import (
    ScopeDiffAnalysisPipeline,
)


class FakeMatcher:
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
            "REQ-001": ("REQ-001", 1.00),
            "REQ-002": ("REQ-002", 0.85),
            "REQ-003": ("REQ-003", 0.88),
            "REQ-004": ("REQ-999", 0.10),
        }

        rows = []

        for _, row in source_dataframe.iterrows():
            source_id = str(
                row["requirement_id"]
            )

            if source_id not in scores:
                continue

            candidate_id, score = scores[
                source_id
            ]

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
                "Müşteri kimliği doğrulanmalıdır.",
                (
                    "Port kontrolü en fazla "
                    "3 kez yapılmalıdır."
                ),
                (
                    "Aktivasyon işlemi "
                    "15 dakika içinde "
                    "tamamlanmalıdır."
                ),
                "Eski kayıt arşivlenmelidir.",
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
                "Müşteri kimliği doğrulanmalıdır.",
                (
                    "Port kontrolü en fazla "
                    "5 kez yapılabilir."
                ),
                (
                    "Aktivasyon işlemi "
                    "30 dakika içinde "
                    "tamamlanmalıdır."
                ),
                (
                    "Yeni siparişlerde "
                    "bildirim oluşturulmalıdır."
                ),
            ],
        }
    )


def create_pipeline() -> ScopeDiffAnalysisPipeline:
    return ScopeDiffAnalysisPipeline(
        matcher=FakeMatcher(),
    )


def test_pipeline_returns_all_changes() -> None:
    pipeline = create_pipeline()

    result = pipeline.analyze(
        create_old_dataframe(),
        create_new_dataframe(),
    )

    assert len(result) == 5


def test_pipeline_detects_numeric_and_modality_change() -> None:
    pipeline = create_pipeline()

    result = pipeline.analyze(
        create_old_dataframe(),
        create_new_dataframe(),
    )

    row = result[
        result["old_requirement_id"]
        == "REQ-002"
    ].iloc[0]

    assert "numeric_change" in (
        row["detailed_change_types"]
    )

    assert "modality_change" in (
        row["detailed_change_types"]
    )


def test_pipeline_detects_duration_change() -> None:
    pipeline = create_pipeline()

    result = pipeline.analyze(
        create_old_dataframe(),
        create_new_dataframe(),
    )

    row = result[
        result["old_requirement_id"]
        == "REQ-003"
    ].iloc[0]

    assert "duration_change" in (
        row["detailed_change_types"]
    )


def test_pipeline_adds_risk_information() -> None:
    pipeline = create_pipeline()

    result = pipeline.analyze(
        create_old_dataframe(),
        create_new_dataframe(),
    )

    row = result[
        result["old_requirement_id"]
        == "REQ-002"
    ].iloc[0]

    assert row["risk_score"] == 65
    assert row["risk_level"] == "high"

    assert 0.0 <= row["confidence"] <= 1.0


def test_pipeline_handles_added_and_removed() -> None:
    pipeline = create_pipeline()

    result = pipeline.analyze(
        create_old_dataframe(),
        create_new_dataframe(),
    )

    removed = result[
        result["change_type"] == "removed"
    ]

    added = result[
        result["change_type"] == "added"
    ]

    assert len(removed) == 1
    assert len(added) == 1

    assert removed.iloc[0]["risk_score"] == 35
    assert added.iloc[0]["risk_score"] == 30