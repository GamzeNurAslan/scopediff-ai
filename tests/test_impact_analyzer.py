import pandas as pd
import pytest

from backend.app.insights.impact_analyzer import (
    RequirementImpactAnalyzer,
)


class FakeMatcher:
    SCORE_MAP = {
        "REQ-002": 0.90,
        "REQ-003": 0.65,
        "REQ-004": 0.30,
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
        source_id = str(
            source_dataframe.iloc[0][
                "requirement_id"
            ]
        )

        rows = []

        for candidate_id in (
            self.candidate_dataframe[
                "requirement_id"
            ]
        ):
            score = self.SCORE_MAP.get(
                str(candidate_id),
                0.10,
            )

            rows.append(
                {
                    "source_requirement_id":
                        source_id,
                    "candidate_requirement_id":
                        str(candidate_id),
                    "similarity_score":
                        score,
                }
            )

        rows.sort(
            key=lambda row:
                row["similarity_score"],
            reverse=True,
        )

        return pd.DataFrame(
            rows[:top_k]
        )


def create_dataframe() -> pd.DataFrame:
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
                    "Port uygunluğu kontrol "
                    "edilmelidir."
                ),
                (
                    "Port kontrolü sonrasında "
                    "kaynak rezerve edilmelidir."
                ),
                (
                    "Sipariş için port bilgisi "
                    "kaydedilmelidir."
                ),
                (
                    "Fatura ödeme tarihi "
                    "oluşturulmalıdır."
                ),
            ],
            "module": [
                "Resource",
                "Resource",
                "Order",
                "Billing",
            ],
        }
    )


def create_analyzer() -> (
    RequirementImpactAnalyzer
):
    return RequirementImpactAnalyzer(
        matcher=FakeMatcher()
    )


def test_related_requirement_is_ranked_first() -> None:
    analyzer = create_analyzer()

    result = analyzer.analyze(
        create_dataframe(),
        "REQ-001",
    )

    assert (
        result.iloc[0][
            "target_requirement_id"
        ]
        == "REQ-002"
    )

    assert result.iloc[0]["rank"] == 1


def test_source_requirement_is_not_returned() -> None:
    analyzer = create_analyzer()

    result = analyzer.analyze(
        create_dataframe(),
        "REQ-001",
    )

    assert (
        "REQ-001"
        not in result[
            "target_requirement_id"
        ].tolist()
    )


def test_impact_scores_are_valid_and_sorted() -> None:
    analyzer = create_analyzer()

    result = analyzer.analyze(
        create_dataframe(),
        "REQ-001",
    )

    assert (
        result["impact_score"]
        .between(0.0, 1.0)
        .all()
    )

    assert (
        result["impact_score"].tolist()
        == sorted(
            result["impact_score"].tolist(),
            reverse=True,
        )
    )


def test_same_module_information_is_added() -> None:
    analyzer = create_analyzer()

    result = analyzer.analyze(
        create_dataframe(),
        "REQ-001",
    )

    row = result[
        result["target_requirement_id"]
        == "REQ-002"
    ].iloc[0]

    assert bool(
        row["same_module"]
    )


def test_reason_uses_candidate_wording() -> None:
    analyzer = create_analyzer()

    result = analyzer.analyze(
        create_dataframe(),
        "REQ-001",
        top_k=1,
    )

    reason = result.iloc[0]["reason"]

    assert (
        "kesin bir etki ilişkisi değildir"
        in reason
    )

    assert (
        "potansiyel bir etki adayıdır"
        in reason
    )


def test_unknown_requirement_raises_error() -> None:
    analyzer = create_analyzer()

    with pytest.raises(
        ValueError
    ) as exception:
        analyzer.analyze(
            create_dataframe(),
            "REQ-999",
        )

    assert (
        "Gereksinim bulunamadı"
        in str(exception.value)
    )


def test_missing_required_column_raises_error() -> None:
    dataframe = (
        create_dataframe()
        .drop(columns=["module"])
    )

    analyzer = create_analyzer()

    with pytest.raises(
        ValueError
    ) as exception:
        analyzer.analyze(
            dataframe,
            "REQ-001",
        )

    assert (
        "Eksik gereksinim sütunları"
        in str(exception.value)
    )