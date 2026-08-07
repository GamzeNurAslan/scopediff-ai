import pandas as pd
import pytest

from backend.app.insights.contradiction_detector import (
    RequirementContradictionDetector,
)


class FakeMatcher:
    """Testler için kontrollü semantic similarity üretir."""

    SCORE_MAP = {
        ("REQ-001", "REQ-002"): 0.95,
        ("REQ-002", "REQ-001"): 0.95,
        ("REQ-003", "REQ-004"): 0.92,
        ("REQ-004", "REQ-003"): 0.92,
    }

    def fit(
        self,
        candidate_dataframe: pd.DataFrame,
    ):
        self.candidate_dataframe = (
            candidate_dataframe.copy()
        )

        return self

    def match_dataframe(
        self,
        source_dataframe: pd.DataFrame,
        top_k: int = 5,
        min_score: float = 0.0,
    ) -> pd.DataFrame:

        rows: list[
            dict[str, object]
        ] = []

        candidate_ids = (
            self.candidate_dataframe[
                "requirement_id"
            ]
            .astype(str)
            .tolist()
        )

        for source_id in (
            source_dataframe[
                "requirement_id"
            ]
            .astype(str)
            .tolist()
        ):
            source_results: list[
                dict[str, object]
            ] = []

            for candidate_id in candidate_ids:

                if source_id == candidate_id:
                    score = 1.0
                else:
                    score = self.SCORE_MAP.get(
                        (
                            source_id,
                            candidate_id,
                        ),
                        0.20,
                    )

                if score < min_score:
                    continue

                source_results.append(
                    {
                        "source_requirement_id":
                            source_id,
                        "candidate_requirement_id":
                            candidate_id,
                        "similarity_score":
                            score,
                    }
                )

            source_results.sort(
                key=lambda row:
                    row["similarity_score"],
                reverse=True,
            )

            rows.extend(
                source_results[:top_k]
            )

        return pd.DataFrame(
            rows
        )


def create_requirements_dataframe() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "requirement_id": [
                "REQ-001",
                "REQ-002",
                "REQ-003",
                "REQ-004",
                "REQ-005",
            ],
            "requirement_text": [
                (
                    "Sipariş iptal "
                    "edilmelidir."
                ),
                (
                    "Sipariş iptal "
                    "edilmemelidir."
                ),
                (
                    "Müşteriye SMS "
                    "gönderilmelidir."
                ),
                (
                    "Müşteriye SMS "
                    "gönderilebilir."
                ),
                (
                    "Fatura son ödeme tarihi "
                    "oluşturulmalıdır."
                ),
            ],
        }
    )


def create_detector() -> (
    RequirementContradictionDetector
):
    return RequirementContradictionDetector(
        matcher=FakeMatcher(),
        min_similarity=0.65,
    )


def test_negation_contradiction_is_detected() -> None:
    detector = create_detector()

    result = detector.detect(
        create_requirements_dataframe()
    )

    row = result[
        (
            result["requirement_id_a"]
            .isin(["REQ-001", "REQ-002"])
        )
        &
        (
            result["requirement_id_b"]
            .isin(["REQ-001", "REQ-002"])
        )
    ].iloc[0]

    assert (
        "negation_change"
        in row["signals"]
    )


def test_modality_contradiction_is_detected() -> None:
    detector = create_detector()

    result = detector.detect(
        create_requirements_dataframe()
    )

    row = result[
        (
            result["requirement_id_a"]
            .isin(["REQ-003", "REQ-004"])
        )
        &
        (
            result["requirement_id_b"]
            .isin(["REQ-003", "REQ-004"])
        )
    ].iloc[0]

    assert (
        "modality_change"
        in row["signals"]
    )


def test_requirement_is_not_compared_with_itself() -> None:
    detector = create_detector()

    result = detector.detect(
        create_requirements_dataframe()
    )

    assert not (
        result["requirement_id_a"]
        == result["requirement_id_b"]
    ).any()


def test_symmetric_pairs_are_not_duplicated() -> None:
    detector = create_detector()

    result = detector.detect(
        create_requirements_dataframe()
    )

    assert len(result) == 2


def test_contradiction_scores_are_valid_and_sorted() -> None:
    detector = create_detector()

    result = detector.detect(
        create_requirements_dataframe()
    )

    assert (
        result["contradiction_score"]
        .between(
            0.0,
            1.0,
        )
        .all()
    )

    assert (
        result["contradiction_score"]
        .tolist()
        == sorted(
            result[
                "contradiction_score"
            ].tolist(),
            reverse=True,
        )
    )


def test_missing_required_column_raises_error() -> None:
    dataframe = (
        create_requirements_dataframe()
        .drop(
            columns=[
                "requirement_text"
            ]
        )
    )

    detector = create_detector()

    with pytest.raises(
        ValueError
    ) as exception:
        detector.detect(
            dataframe
        )

    assert (
        "Eksik gereksinim sütunları"
        in str(exception.value)
    )