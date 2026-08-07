import pandas as pd
import pytest

from backend.app.history.version_history import (
    RequirementVersionHistory,
)


def create_version_history_dataframe() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "requirement_id": [
                "REQ-017",
                "REQ-017",
                "REQ-017",
                "REQ-020",
            ],
            "version": [
                2.0,
                1.0,
                3.0,
                1.0,
            ],
            "requirement_text": [
                (
                    "Rezerve edilen port 30 dakika "
                    "içinde serbest bırakılmalıdır."
                ),
                (
                    "Rezerve edilen port 15 dakika "
                    "içinde serbest bırakılmalıdır."
                ),
                (
                    "Rezerve edilen port sipariş "
                    "iptal edilene kadar tutulabilir."
                ),
                (
                    "Sipariş doğrulaması "
                    "tamamlanmalıdır."
                ),
            ],
            "module": [
                "Resource",
                "Resource",
                "Resource",
                "Order",
            ],
            "previous_version": [
                1.0,
                None,
                2.0,
                None,
            ],
            "transition_id": [
                "TR-017-1",
                None,
                "TR-017-2",
                None,
            ],
            "change_type_from_previous": [
                "duration_change",
                None,
                "condition_change",
                None,
            ],
            "risk_from_previous": [
                "high",
                None,
                "high",
                None,
            ],
            "change_explanation": [
                "Port rezervasyon süresi uzatıldı.",
                "Initial synthetic version.",
                (
                    "Port serbest bırakma koşulu "
                    "değiştirildi."
                ),
                "Initial synthetic version.",
            ],
            "is_current_version": [
                False,
                False,
                True,
                True,
            ],
        }
    )


def test_history_is_sorted_by_version() -> None:
    service = RequirementVersionHistory()

    history = service.get_history(
        create_version_history_dataframe(),
        "REQ-017",
    )

    assert history["version"].tolist() == [
        1.0,
        2.0,
        3.0,
    ]


def test_history_only_returns_requested_requirement() -> None:
    service = RequirementVersionHistory()

    history = service.get_history(
        create_version_history_dataframe(),
        "REQ-017",
    )

    assert (
        history["requirement_id"]
        .eq("REQ-017")
        .all()
    )

    assert len(history) == 3


def test_unknown_requirement_raises_error() -> None:
    service = RequirementVersionHistory()

    with pytest.raises(ValueError) as exception:
        service.get_history(
            create_version_history_dataframe(),
            "REQ-999",
        )

    assert "Gereksinim bulunamadı" in str(
        exception.value
    )


def test_summary_contains_version_counts() -> None:
    service = RequirementVersionHistory()

    summary = service.get_summary(
        create_version_history_dataframe(),
        "REQ-017",
    )

    assert summary["version_count"] == 3
    assert summary["transition_count"] == 2
    assert summary["first_version"] == "1.0"
    assert summary["latest_version"] == "3.0"


def test_summary_contains_change_types() -> None:
    service = RequirementVersionHistory()

    summary = service.get_summary(
        create_version_history_dataframe(),
        "REQ-017",
    )

    assert summary["change_types"] == [
        "duration_change",
        "condition_change",
    ]


def test_summary_detects_highest_risk() -> None:
    service = RequirementVersionHistory()

    summary = service.get_summary(
        create_version_history_dataframe(),
        "REQ-017",
    )

    assert summary["highest_risk"] == "high"


def test_timeline_marks_initial_and_current_versions() -> None:
    service = RequirementVersionHistory()

    timeline = service.build_timeline(
        create_version_history_dataframe(),
        "REQ-017",
    )

    assert bool(
        timeline.iloc[0][
            "is_initial_version"
        ]
    )

    assert bool(
        timeline.iloc[-1][
            "is_current_version"
        ]
    )


def test_timeline_uses_baseline_for_first_version() -> None:
    service = RequirementVersionHistory()

    timeline = service.build_timeline(
        create_version_history_dataframe(),
        "REQ-017",
    )

    assert (
        timeline.iloc[0]["change_type"]
        == "baseline"
    )

    assert (
        timeline.iloc[0]["risk_level"]
        == "none"
    )