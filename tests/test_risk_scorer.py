import pytest

from backend.app.comparison.change_analyzer import (
    DetectedChange,
    DetailedChangeType,
)
from backend.app.comparison.change_detector import ChangeType
from backend.app.risk.risk_scorer import (
    RequirementRiskScorer,
)


def create_change(
    change_type: DetailedChangeType,
    old_value: str,
    new_value: str,
) -> DetectedChange:
    return DetectedChange(
        change_type=change_type,
        old_value=old_value,
        new_value=new_value,
        explanation="Test açıklaması",
    )


def test_unchanged_requirement_has_low_risk() -> None:
    scorer = RequirementRiskScorer()

    result = scorer.assess(
        base_change_type=ChangeType.UNCHANGED,
        similarity_score=1.0,
        match_strategy="requirement_id",
    )

    assert result.risk_score == 0
    assert result.risk_level.value == "low"
    assert result.confidence == 1.0


def test_numeric_change_increases_risk() -> None:
    scorer = RequirementRiskScorer()

    numeric_change = create_change(
        DetailedChangeType.NUMERIC,
        "3",
        "5",
    )

    result = scorer.assess(
        base_change_type=ChangeType.CHANGED,
        similarity_score=0.80,
        detailed_changes=[
            numeric_change,
        ],
    )

    assert result.risk_score == 35
    assert result.risk_level.value == "medium"


def test_numeric_and_modality_change_is_high_risk() -> None:
    scorer = RequirementRiskScorer()

    changes = [
        create_change(
            DetailedChangeType.NUMERIC,
            "3",
            "5",
        ),
        create_change(
            DetailedChangeType.MODALITY,
            "mandatory",
            "optional",
        ),
    ]

    result = scorer.assess(
        base_change_type=ChangeType.CHANGED,
        similarity_score=0.85,
        detailed_changes=changes,
    )

    assert result.risk_score == 65
    assert result.risk_level.value == "high"


def test_risk_score_is_capped_at_100() -> None:
    scorer = RequirementRiskScorer()

    changes = [
        create_change(
            DetailedChangeType.NUMERIC,
            "3",
            "5",
        ),
        create_change(
            DetailedChangeType.DURATION,
            "15 dakika",
            "30 dakika",
        ),
        create_change(
            DetailedChangeType.MODALITY,
            "mandatory",
            "optional",
        ),
        create_change(
            DetailedChangeType.NEGATION,
            "absent",
            "present",
        ),
        create_change(
            DetailedChangeType.CONDITION,
            "yok",
            "ise",
        ),
        create_change(
            DetailedChangeType.SCOPE,
            "tüm",
            "yalnızca",
        ),
        create_change(
            DetailedChangeType.ACTOR,
            "müşteri",
            "operatör",
        ),
        create_change(
            DetailedChangeType.STATE,
            "aktif",
            "pasif",
        ),
    ]

    result = scorer.assess(
        base_change_type=ChangeType.CHANGED,
        similarity_score=0.80,
        detailed_changes=changes,
    )

    assert result.risk_score == 100
    assert result.risk_level.value == "critical"


def test_added_and_removed_have_baseline_risk() -> None:
    scorer = RequirementRiskScorer()

    added = scorer.assess(
        base_change_type=ChangeType.ADDED,
        similarity_score=0.0,
    )

    removed = scorer.assess(
        base_change_type=ChangeType.REMOVED,
        similarity_score=0.0,
    )

    assert added.risk_score == 30
    assert added.risk_level.value == "medium"

    assert removed.risk_score == 35
    assert removed.risk_level.value == "medium"


def test_requirement_id_match_has_higher_confidence() -> None:
    scorer = RequirementRiskScorer()

    change = create_change(
        DetailedChangeType.NUMERIC,
        "3",
        "5",
    )

    id_result = scorer.assess(
        base_change_type=ChangeType.CHANGED,
        similarity_score=0.55,
        detailed_changes=[change],
        match_strategy="requirement_id",
    )

    semantic_result = scorer.assess(
        base_change_type=ChangeType.CHANGED,
        similarity_score=0.55,
        detailed_changes=[change],
        match_strategy="text_similarity",
    )

    assert (
        id_result.confidence
        > semantic_result.confidence
    )


def test_confidence_is_between_zero_and_one() -> None:
    scorer = RequirementRiskScorer()

    result = scorer.assess(
        base_change_type=ChangeType.PARAPHRASED,
        similarity_score=0.88,
    )

    assert 0.0 <= result.confidence <= 1.0


def test_explanation_contains_detected_values() -> None:
    scorer = RequirementRiskScorer()

    change = create_change(
        DetailedChangeType.NUMERIC,
        "3",
        "5",
    )

    result = scorer.assess(
        base_change_type=ChangeType.CHANGED,
        similarity_score=0.80,
        detailed_changes=[change],
    )

    assert "Sayısal değer" in result.explanation
    assert "3" in result.explanation
    assert "5" in result.explanation


def test_invalid_similarity_score_raises_error() -> None:
    scorer = RequirementRiskScorer()

    with pytest.raises(ValueError):
        scorer.assess(
            base_change_type=ChangeType.CHANGED,
            similarity_score=1.50,
        )


def test_risk_assessment_can_be_converted_to_dict() -> None:
    scorer = RequirementRiskScorer()

    change = create_change(
        DetailedChangeType.MODALITY,
        "mandatory",
        "optional",
    )

    result = scorer.assess(
        base_change_type=ChangeType.CHANGED,
        similarity_score=0.90,
        detailed_changes=[change],
    )

    data = result.to_dict()

    assert data["risk_level"] == "medium"
    assert data["risk_score"] == 45

    assert (
        data["factors"][0]["old_value"]
        == "zorunlu"
    )

    assert (
        data["factors"][0]["new_value"]
        == "opsiyonel"
    )