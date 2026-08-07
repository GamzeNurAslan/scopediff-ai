from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

import pandas as pd

from backend.app.comparison.change_analyzer import (
    DetailedChangeType,
    RequirementChangeAnalyzer,
)


@dataclass(frozen=True)
class ContradictionCandidate:
    """
    İncelenmesi gereken potansiyel bir gereksinim çelişkisini temsil eder.
    """

    requirement_id_a: str
    requirement_id_b: str
    text_a: str
    text_b: str
    similarity_score: float
    contradiction_score: float
    signals: tuple[str, ...]
    reason: str
    rank: int

    def to_dict(self) -> dict[str, object]:
        result = asdict(self)

        result["signals"] = list(
            self.signals
        )

        return result


class RequirementContradictionDetector:
    """
    Semantik olarak benzer gereksinimler arasında potansiyel
    çelişki sinyallerini arar.

    Bu modül kesin çelişki kararı vermez.
    Sonuçlar analist incelemesi için aday olarak kullanılmalıdır.
    """

    REQUIRED_COLUMNS = {
        "requirement_id",
        "requirement_text",
    }

    SIGNAL_WEIGHTS = {
        DetailedChangeType.NEGATION.value: 1.00,
        DetailedChangeType.MODALITY.value: 0.90,
        DetailedChangeType.STATE.value: 0.80,
        DetailedChangeType.SCOPE.value: 0.70,
        DetailedChangeType.NUMERIC.value: 0.60,
        DetailedChangeType.DURATION.value: 0.60,
        DetailedChangeType.CONDITION.value: 0.60,
        DetailedChangeType.ACTOR.value: 0.50,
    }

    def __init__(
        self,
        matcher: Any,
        min_similarity: float = 0.65,
        min_contradiction_score: float = 0.60,
    ) -> None:
        if not 0.0 <= min_similarity <= 1.0:
            raise ValueError(
                "min_similarity 0 ile 1 arasında olmalıdır."
            )

        if not 0.0 <= min_contradiction_score <= 1.0:
            raise ValueError(
                "min_contradiction_score 0 ile 1 arasında olmalıdır."
            )

        self.matcher = matcher
        self.min_similarity = min_similarity
        self.min_contradiction_score = (
            min_contradiction_score
        )

        self.change_analyzer = (
            RequirementChangeAnalyzer()
        )

    @classmethod
    def _validate_dataframe(
        cls,
        dataframe: pd.DataFrame,
    ) -> None:
        """Gereksinim tablosunu doğrular."""

        if not isinstance(
            dataframe,
            pd.DataFrame,
        ):
            raise TypeError(
                "Gereksinim verisi pandas DataFrame olmalıdır."
            )

        if dataframe.empty:
            raise ValueError(
                "Gereksinim tablosu boş olamaz."
            )

        missing_columns = (
            cls.REQUIRED_COLUMNS
            - set(dataframe.columns)
        )

        if missing_columns:
            missing = ", ".join(
                sorted(missing_columns)
            )

            raise ValueError(
                f"Eksik gereksinim sütunları: {missing}"
            )

        ids = (
            dataframe["requirement_id"]
            .astype(str)
            .str.strip()
        )

        if ids.duplicated().any():
            raise ValueError(
                "requirement_id değerleri benzersiz olmalıdır."
            )

    @classmethod
    def _get_contradiction_signals(
        cls,
        changes,
    ) -> tuple[list[str], float]:
        """
        ChangeAnalyzer çıktısından contradiction açısından
        anlamlı sinyalleri çıkarır.
        """

        signals: list[str] = []

        signal_strength = 0.0

        for change in changes:
            change_type = (
                change.change_type.value
            )

            if (
                change_type
                not in cls.SIGNAL_WEIGHTS
            ):
                continue

            if change_type not in signals:
                signals.append(
                    change_type
                )

            signal_strength = max(
                signal_strength,
                cls.SIGNAL_WEIGHTS[
                    change_type
                ],
            )

        return (
            signals,
            signal_strength,
        )

    @staticmethod
    def _create_reason(
        signals: list[str],
        similarity_score: float,
    ) -> str:
        signal_text = ", ".join(
            signals
        )

        return (
            "İki gereksinim arasında "
            f"{similarity_score:.2f} semantik benzerlik ve "
            f"şu potansiyel çelişki sinyalleri bulundu: "
            f"{signal_text}. "
            "Bu sonuç kesin bir çelişki kararı değildir; "
            "analist tarafından incelenmesi gereken bir adaydır."
        )

    def detect(
        self,
        dataframe: pd.DataFrame,
        top_k: int = 5,
    ) -> pd.DataFrame:
        """
        Gereksinim tablosundaki potansiyel çelişkileri sıralar.
        """

        self._validate_dataframe(
            dataframe
        )

        if top_k <= 0:
            raise ValueError(
                "top_k sıfırdan büyük olmalıdır."
            )

        prepared_data = (
            dataframe
            .copy()
            .reset_index(drop=True)
        )

        prepared_data[
            "requirement_id"
        ] = (
            prepared_data[
                "requirement_id"
            ]
            .astype(str)
            .str.strip()
        )

        requirement_lookup = (
            prepared_data
            .set_index("requirement_id")
        )

        self.matcher.fit(
            prepared_data
        )

        match_results = (
            self.matcher.match_dataframe(
                prepared_data,
                top_k=top_k,
                min_score=self.min_similarity,
            )
        )

        candidates: list[
            ContradictionCandidate
        ] = []

        seen_pairs: set[
            tuple[str, str]
        ] = set()

        for _, match in match_results.iterrows():
            requirement_id_a = str(
                match["source_requirement_id"]
            ).strip()

            requirement_id_b = str(
                match["candidate_requirement_id"]
            ).strip()

            # Gereksinimi kendisiyle karşılaştırmayız.
            if (
                requirement_id_a
                == requirement_id_b
            ):
                continue

            pair_key = tuple(
                sorted(
                    (
                        requirement_id_a,
                        requirement_id_b,
                    )
                )
            )

            # A-B ve B-A'yı iki kez raporlamayız.
            if pair_key in seen_pairs:
                continue

            seen_pairs.add(
                pair_key
            )

            similarity_score = float(
                match["similarity_score"]
            )

            if (
                similarity_score
                < self.min_similarity
            ):
                continue

            text_a = str(
                requirement_lookup.loc[
                    requirement_id_a,
                    "requirement_text",
                ]
            )

            text_b = str(
                requirement_lookup.loc[
                    requirement_id_b,
                    "requirement_text",
                ]
            )

            detailed_changes = (
                self.change_analyzer.analyze(
                    old_text=text_a,
                    new_text=text_b,
                )
            )

            (
                signals,
                signal_strength,
            ) = (
                self._get_contradiction_signals(
                    detailed_changes
                )
            )

            if not signals:
                continue

            contradiction_score = (
                0.60 * similarity_score
                + 0.40 * signal_strength
            )

            contradiction_score = max(
                0.0,
                min(
                    1.0,
                    contradiction_score,
                ),
            )

            if (
                contradiction_score
                < self.min_contradiction_score
            ):
                continue

            candidates.append(
                ContradictionCandidate(
                    requirement_id_a=(
                        requirement_id_a
                    ),
                    requirement_id_b=(
                        requirement_id_b
                    ),
                    text_a=text_a,
                    text_b=text_b,
                    similarity_score=round(
                        similarity_score,
                        4,
                    ),
                    contradiction_score=round(
                        contradiction_score,
                        4,
                    ),
                    signals=tuple(
                        signals
                    ),
                    reason=self._create_reason(
                        signals,
                        similarity_score,
                    ),
                    rank=0,
                )
            )

        candidates.sort(
            key=lambda candidate: (
                candidate.contradiction_score,
                candidate.similarity_score,
            ),
            reverse=True,
        )

        ranked_candidates: list[
            ContradictionCandidate
        ] = []

        for rank, candidate in enumerate(
            candidates,
            start=1,
        ):
            ranked_candidates.append(
                ContradictionCandidate(
                    requirement_id_a=(
                        candidate.requirement_id_a
                    ),
                    requirement_id_b=(
                        candidate.requirement_id_b
                    ),
                    text_a=candidate.text_a,
                    text_b=candidate.text_b,
                    similarity_score=(
                        candidate.similarity_score
                    ),
                    contradiction_score=(
                        candidate.contradiction_score
                    ),
                    signals=(
                        candidate.signals
                    ),
                    reason=candidate.reason,
                    rank=rank,
                )
            )

        return pd.DataFrame(
            [
                candidate.to_dict()
                for candidate
                in ranked_candidates
            ],
            columns=[
                "requirement_id_a",
                "requirement_id_b",
                "text_a",
                "text_b",
                "similarity_score",
                "contradiction_score",
                "signals",
                "reason",
                "rank",
            ],
        )