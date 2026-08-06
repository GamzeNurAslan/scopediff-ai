import pandas as pd
import pytest

from backend.app.matching.tfidf_matcher import (
    MatcherNotFittedError,
    TfidfRequirementMatcher,
)


def create_candidate_dataframe() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "requirement_id": [
                "REQ-101",
                "REQ-102",
                "REQ-103",
            ],
            "requirement_text": [
                "Port kontrolü en fazla 3 kez yapılmalıdır.",
                "Aktivasyon tamamlandığında müşteriye SMS gönderilmelidir.",
                "Fatura için son ödeme tarihi oluşturulmalıdır.",
            ],
        }
    )


def test_find_matches_returns_most_similar_requirement_first() -> None:
    candidates = create_candidate_dataframe()

    matcher = TfidfRequirementMatcher()
    matcher.fit(candidates)

    matches = matcher.find_matches(
        "Port kontrolü en fazla 5 kez yapılmalıdır.",
        top_k=3,
    )

    assert matches[0].candidate_requirement_id == "REQ-101"
    assert matches[0].rank == 1


def test_similarity_scores_are_between_zero_and_one() -> None:
    candidates = create_candidate_dataframe()

    matcher = TfidfRequirementMatcher().fit(candidates)

    matches = matcher.find_matches(
        "Aktivasyon sonrası müşteriye SMS gönderilmelidir.",
        top_k=3,
    )

    assert all(
        0.0 <= match.similarity_score <= 1.0
        for match in matches
    )

    assert matches[0].similarity_score >= matches[1].similarity_score


def test_find_matches_respects_top_k() -> None:
    matcher = TfidfRequirementMatcher().fit(
        create_candidate_dataframe()
    )

    matches = matcher.find_matches(
        "Müşteriye bilgilendirme gönderilmelidir.",
        top_k=2,
    )

    assert len(matches) == 2
    assert [match.rank for match in matches] == [1, 2]


def test_find_matches_before_fit_raises_error() -> None:
    matcher = TfidfRequirementMatcher()

    with pytest.raises(MatcherNotFittedError) as exception:
        matcher.find_matches("Port kontrolü yapılmalıdır.")

    assert "fit edilmelidir" in str(exception.value)


def test_empty_query_returns_empty_match_list() -> None:
    matcher = TfidfRequirementMatcher().fit(
        create_candidate_dataframe()
    )

    matches = matcher.find_matches("   ")

    assert matches == []


def test_match_dataframe_returns_ranked_results() -> None:
    source_dataframe = pd.DataFrame(
        {
            "requirement_id": [
                "REQ-001",
                "REQ-002",
            ],
            "requirement_text": [
                "Port kontrolü en fazla 5 kez yapılmalıdır.",
                "Müşteriye aktivasyon SMS mesajı gönderilmelidir.",
            ],
        }
    )

    matcher = TfidfRequirementMatcher().fit(
        create_candidate_dataframe()
    )

    result = matcher.match_dataframe(
        source_dataframe,
        top_k=2,
    )

    assert len(result) == 4

    first_source_results = result[
        result["source_requirement_id"] == "REQ-001"
    ]

    assert first_source_results.iloc[0][
        "candidate_requirement_id"
    ] == "REQ-101"

    assert first_source_results.iloc[0]["rank"] == 1