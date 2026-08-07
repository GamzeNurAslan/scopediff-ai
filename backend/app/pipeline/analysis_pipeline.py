from __future__ import annotations

from typing import Any

import pandas as pd

from backend.app.comparison.change_analyzer import (
    RequirementChangeAnalyzer,
)
from backend.app.comparison.change_detector import (
    ChangeType,
    RequirementChangeDetector,
)
from backend.app.risk.risk_scorer import (
    RequirementRiskScorer,
)


class ScopeDiffAnalysisPipeline:
    """
    ScopeDiff'in temel analiz bileşenlerini tek akışta çalıştırır.

    Akış:
    1. Gereksinimleri eşleştirir.
    2. Temel değişiklik türünü belirler.
    3. Ayrıntılı değişiklikleri tespit eder.
    4. Risk skoru, risk seviyesi ve confidence üretir.
    """

    def __init__(
        self,
        matcher: Any,
        changed_threshold: float = 0.45,
        paraphrase_threshold: float = 0.80,
    ) -> None:
        self.change_detector = RequirementChangeDetector(
            matcher=matcher,
            changed_threshold=changed_threshold,
            paraphrase_threshold=paraphrase_threshold,
        )

        self.change_analyzer = RequirementChangeAnalyzer()
        self.risk_scorer = RequirementRiskScorer()

    def analyze(
        self,
        old_dataframe: pd.DataFrame,
        new_dataframe: pd.DataFrame,
        top_k: int = 5,
    ) -> pd.DataFrame:
        """
        İki gereksinim sürümü arasındaki tam analizi gerçekleştirir.
        """

        detected_changes = self.change_detector.compare(
            old_dataframe=old_dataframe,
            new_dataframe=new_dataframe,
            top_k=top_k,
        )

        result_rows: list[dict[str, object]] = []

        for _, row in detected_changes.iterrows():
            old_text = row["old_text"]
            new_text = row["new_text"]

            detailed_changes = []

            if pd.notna(old_text) and pd.notna(new_text):
                detailed_changes = self.change_analyzer.analyze(
                    old_text=old_text,
                    new_text=new_text,
                )

            effective_change_type = row["change_type"]

            if (
                    effective_change_type == ChangeType.PARAPHRASED.value
                    and detailed_changes
            ):
                effective_change_type = ChangeType.CHANGED.value

            risk_assessment = self.risk_scorer.assess(
                base_change_type=effective_change_type,
                similarity_score=float(
                    row["similarity_score"]
                ),
                detailed_changes=detailed_changes,
                match_strategy=str(
                    row["match_strategy"]
                ),
            )

            result_rows.append(
                {
                    "old_requirement_id":
                        row["old_requirement_id"],
                    "new_requirement_id":
                        row["new_requirement_id"],
                    "old_text":
                        row["old_text"],
                    "new_text":
                        row["new_text"],
                    "change_type":
                        effective_change_type,
                    "similarity_score":
                        float(row["similarity_score"]),
                    "match_strategy":
                        row["match_strategy"],
                    "detailed_change_types": [
                        change.change_type.value
                        for change in detailed_changes
                    ],
                    "detailed_changes": [
                        change.to_dict()
                        for change in detailed_changes
                    ],
                    "risk_score":
                        risk_assessment.risk_score,
                    "risk_level":
                        risk_assessment.risk_level.value,
                    "confidence":
                        risk_assessment.confidence,
                    "risk_explanation":
                        risk_assessment.explanation,
                }
            )

        return pd.DataFrame(
            result_rows,
            columns=[
                "old_requirement_id",
                "new_requirement_id",
                "old_text",
                "new_text",
                "change_type",
                "similarity_score",
                "match_strategy",
                "detailed_change_types",
                "detailed_changes",
                "risk_score",
                "risk_level",
                "confidence",
                "risk_explanation",
            ],
        )