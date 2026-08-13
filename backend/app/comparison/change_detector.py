from __future__ import annotations

from dataclasses import asdict, dataclass
from enum import Enum
from typing import Any

import pandas as pd

from backend.app.text_preprocessor import normalize_text


class ChangeType(str, Enum):
    """Gereksinimler arasındaki temel değişiklik türleri."""

    UNCHANGED = "unchanged"
    PARAPHRASED = "paraphrased"
    CHANGED = "changed"
    ADDED = "added"
    REMOVED = "removed"


@dataclass(frozen=True)
class RequirementChange:
    """Tespit edilen bir gereksinim değişikliğini temsil eder."""

    old_requirement_id: str | None
    new_requirement_id: str | None
    old_text: str | None
    new_text: str | None
    change_type: ChangeType
    similarity_score: float
    match_strategy: str

    def to_dict(self) -> dict[str, object]:
        result = asdict(self)
        result["change_type"] = self.change_type.value
        return result


class RequirementChangeDetector:
    """
    İki gereksinim sürümünü karşılaştırır.

    Önce aynı requirement_id değerlerine sahip kayıtları eşleştirir.
    Ardından kalan kayıtları metin benzerliğine göre eşleştirir.
    """

    REQUIRED_COLUMNS = {
        "requirement_id",
        "requirement_text",
    }

    def __init__(
        self,
        matcher: Any,
        changed_threshold: float = 0.45,
        paraphrase_threshold: float = 0.80,
    ) -> None:

        if not 0.0 <= changed_threshold <= 1.0:
            raise ValueError(
                "changed_threshold 0 ile 1 arasında olmalıdır."
            )

        if not 0.0 <= paraphrase_threshold <= 1.0:
            raise ValueError(
                "paraphrase_threshold 0 ile 1 arasında olmalıdır."
            )

        if changed_threshold > paraphrase_threshold:
            raise ValueError(
                "changed_threshold, paraphrase_threshold değerinden "
                "büyük olamaz."
            )

        self.matcher = matcher
        self.changed_threshold = changed_threshold
        self.paraphrase_threshold = paraphrase_threshold

    @classmethod
    def _validate_dataframe(
        cls,
        dataframe: pd.DataFrame,
        dataframe_name: str,
    ) -> None:

        if not isinstance(dataframe, pd.DataFrame):
            raise TypeError(
                f"{dataframe_name} pandas DataFrame olmalıdır."
            )

        missing_columns = (
            cls.REQUIRED_COLUMNS
            - set(dataframe.columns)
        )

        if missing_columns:
            missing = ", ".join(sorted(missing_columns))

            raise ValueError(
                f"{dataframe_name} için eksik sütunlar: {missing}"
            )

        ids = (
            dataframe["requirement_id"]
            .astype(str)
            .str.strip()
        )

        if ids.duplicated().any():
            duplicate_ids = sorted(
                ids[
                    ids.duplicated(keep=False)
                ].unique().tolist()
            )

            raise ValueError(
                f"{dataframe_name} içinde tekrarlanan "
                f"requirement_id: {', '.join(duplicate_ids)}"
            )

    def _classify_matched_pair(
        self,
        old_text: object,
        new_text: object,
        similarity_score: float,
    ) -> ChangeType:
        """
        Eşleşen iki gereksinimin değişiklik sınıfını belirler.
        """

        normalized_old = normalize_text(old_text)
        normalized_new = normalize_text(new_text)

        if normalized_old == normalized_new:
            return ChangeType.UNCHANGED

        if similarity_score >= self.paraphrase_threshold:
            return ChangeType.PARAPHRASED

        return ChangeType.CHANGED

    @staticmethod
    def _build_score_lookup(
        match_results: pd.DataFrame,
    ) -> dict[tuple[str, str], float]:

        score_lookup: dict[tuple[str, str], float] = {}

        if match_results.empty:
            return score_lookup

        required_columns = {
            "source_requirement_id",
            "candidate_requirement_id",
            "similarity_score",
        }

        missing_columns = (
            required_columns
            - set(match_results.columns)
        )

        if missing_columns:
            missing = ", ".join(sorted(missing_columns))

            raise ValueError(
                f"Eşleştirme sonucunda eksik sütunlar: {missing}"
            )

        for _, row in match_results.iterrows():

            source_id = str(
                row["source_requirement_id"]
            ).strip()

            candidate_id = str(
                row["candidate_requirement_id"]
            ).strip()

            score = float(
                row["similarity_score"]
            )

            key = (
                source_id,
                candidate_id,
            )

            current_score = score_lookup.get(
                key,
                0.0,
            )

            score_lookup[key] = max(
                current_score,
                score,
            )

        return score_lookup

    def compare(
        self,
        old_dataframe: pd.DataFrame,
        new_dataframe: pd.DataFrame,
        top_k: int = 5,
    ) -> pd.DataFrame:
        """
        İki gereksinim versiyonunu karşılaştırır.
        """

        self._validate_dataframe(
            old_dataframe,
            "Eski gereksinim tablosu",
        )

        self._validate_dataframe(
            new_dataframe,
            "Yeni gereksinim tablosu",
        )

        old_data = (
            old_dataframe
            .copy()
            .reset_index(drop=True)
        )

        new_data = (
            new_dataframe
            .copy()
            .reset_index(drop=True)
        )

        old_data["requirement_id"] = (
            old_data["requirement_id"]
            .astype(str)
            .str.strip()
        )

        new_data["requirement_id"] = (
            new_data["requirement_id"]
            .astype(str)
            .str.strip()
        )

        old_by_id = old_data.set_index(
            "requirement_id"
        )

        new_by_id = new_data.set_index(
            "requirement_id"
        )

        self.matcher.fit(new_data)

        match_results = self.matcher.match_dataframe(
            old_data,
            top_k=top_k,
            min_score=0.0,
        )

        score_lookup = self._build_score_lookup(
            match_results
        )

        used_old_ids: set[str] = set()
        used_new_ids: set[str] = set()

        changes: list[RequirementChange] = []

        common_ids = sorted(
            set(old_by_id.index)
            & set(new_by_id.index)
        )

        for requirement_id in common_ids:

            old_row = old_by_id.loc[
                requirement_id
            ]

            new_row = new_by_id.loc[
                requirement_id
            ]

            score = score_lookup.get(
                (
                    requirement_id,
                    requirement_id,
                ),
                0.0,
            )

            change_type = (
                self._classify_matched_pair(
                    old_row["requirement_text"],
                    new_row["requirement_text"],
                    score,
                )
            )

            changes.append(
                RequirementChange(
                    old_requirement_id=requirement_id,
                    new_requirement_id=requirement_id,
                    old_text=str(
                        old_row["requirement_text"]
                    ),
                    new_text=str(
                        new_row["requirement_text"]
                    ),
                    change_type=change_type,
                    similarity_score=score,
                    match_strategy="requirement_id",
                )
            )

            used_old_ids.add(
                requirement_id
            )

            used_new_ids.add(
                requirement_id
            )

        if not match_results.empty:

            sorted_matches = (
                match_results
                .sort_values(
                    by="similarity_score",
                    ascending=False,
                )
            )

            for _, match_row in sorted_matches.iterrows():

                old_id = str(
                    match_row[
                        "source_requirement_id"
                    ]
                ).strip()

                new_id = str(
                    match_row[
                        "candidate_requirement_id"
                    ]
                ).strip()

                score = float(
                    match_row[
                        "similarity_score"
                    ]
                )

                if score < self.changed_threshold:
                    continue

                if (
                    old_id in used_old_ids
                    or new_id in used_new_ids
                ):
                    continue

                old_row = old_by_id.loc[
                    old_id
                ]

                new_row = new_by_id.loc[
                    new_id
                ]

                change_type = (
                    self._classify_matched_pair(
                        old_row[
                            "requirement_text"
                        ],
                        new_row[
                            "requirement_text"
                        ],
                        score,
                    )
                )

                changes.append(
                    RequirementChange(
                        old_requirement_id=old_id,
                        new_requirement_id=new_id,
                        old_text=str(
                            old_row[
                                "requirement_text"
                            ]
                        ),
                        new_text=str(
                            new_row[
                                "requirement_text"
                            ]
                        ),
                        change_type=change_type,
                        similarity_score=score,
                        match_strategy="text_similarity",
                    )
                )

                used_old_ids.add(old_id)
                used_new_ids.add(new_id)

        for old_id, old_row in old_by_id.iterrows():

            if old_id in used_old_ids:
                continue

            changes.append(
                RequirementChange(
                    old_requirement_id=str(
                        old_id
                    ),
                    new_requirement_id=None,
                    old_text=str(
                        old_row[
                            "requirement_text"
                        ]
                    ),
                    new_text=None,
                    change_type=ChangeType.REMOVED,
                    similarity_score=0.0,
                    match_strategy="unmatched",
                )
            )

        for new_id, new_row in new_by_id.iterrows():

            if new_id in used_new_ids:
                continue

            changes.append(
                RequirementChange(
                    old_requirement_id=None,
                    new_requirement_id=str(
                        new_id
                    ),
                    old_text=None,
                    new_text=str(
                        new_row[
                            "requirement_text"
                        ]
                    ),
                    change_type=ChangeType.ADDED,
                    similarity_score=0.0,
                    match_strategy="unmatched",
                )
            )

        return pd.DataFrame(
            [
                change.to_dict()
                for change in changes
            ],
            columns=[
                "old_requirement_id",
                "new_requirement_id",
                "old_text",
                "new_text",
                "change_type",
                "similarity_score",
                "match_strategy",
            ],
        )