from __future__ import annotations

import re
from dataclasses import asdict, dataclass
from typing import Any

import pandas as pd

from backend.app.text_preprocessor import normalize_text


@dataclass(frozen=True)
class ImpactCandidate:
    """Bir gereksinim değişikliği için potansiyel etki adayını temsil eder."""

    source_requirement_id: str
    target_requirement_id: str
    source_module: str
    target_module: str
    similarity_score: float
    keyword_overlap: float
    same_module: bool
    impact_score: float
    reason: str
    rank: int

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


class RequirementImpactAnalyzer:
    """
    Değişen bir gereksinimle ilişkili olabilecek diğer
    gereksinimleri sıralar.

    Sonuçlar kesin etki ilişkisi değildir.
    Analist incelemesi için aday üretir.
    """

    REQUIRED_COLUMNS = {
        "requirement_id",
        "requirement_text",
        "module",
    }

    STOP_WORDS = {
        "ve",
        "veya",
        "ile",
        "için",
        "bir",
        "bu",
        "şu",
        "olarak",
        "sonra",
        "önce",
        "ise",
        "de",
        "da",
    }

    TOKEN_PATTERN = re.compile(
        r"[a-zA-ZçğıöşüÇĞİÖŞÜ0-9]+"
    )

    def __init__(
        self,
        matcher: Any,
        semantic_weight: float = 0.70,
        keyword_weight: float = 0.20,
        module_weight: float = 0.10,
    ) -> None:
        total_weight = (
            semantic_weight
            + keyword_weight
            + module_weight
        )

        if abs(total_weight - 1.0) > 1e-9:
            raise ValueError(
                "Impact ağırlıklarının toplamı 1.0 olmalıdır."
            )

        if any(
            weight < 0.0
            for weight in (
                semantic_weight,
                keyword_weight,
                module_weight,
            )
        ):
            raise ValueError(
                "Impact ağırlıkları negatif olamaz."
            )

        self.matcher = matcher
        self.semantic_weight = semantic_weight
        self.keyword_weight = keyword_weight
        self.module_weight = module_weight

    @classmethod
    def _validate_dataframe(
        cls,
        dataframe: pd.DataFrame,
    ) -> None:
        if not isinstance(dataframe, pd.DataFrame):
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

        requirement_ids = (
            dataframe["requirement_id"]
            .astype(str)
            .str.strip()
        )

        if requirement_ids.duplicated().any():
            raise ValueError(
                "requirement_id değerleri benzersiz olmalıdır."
            )

    @classmethod
    def _extract_keywords(
        cls,
        text: object,
    ) -> set[str]:
        normalized = normalize_text(text)

        tokens = {
            token.lower()
            for token in cls.TOKEN_PATTERN.findall(
                normalized
            )
        }

        return {
            token
            for token in tokens
            if (
                len(token) >= 2
                and token not in cls.STOP_WORDS
            )
        }

    @classmethod
    def _keyword_overlap(
        cls,
        source_text: object,
        target_text: object,
    ) -> tuple[float, list[str]]:
        source_keywords = cls._extract_keywords(
            source_text
        )

        target_keywords = cls._extract_keywords(
            target_text
        )

        if not source_keywords:
            return 0.0, []

        common_keywords = sorted(
            source_keywords
            & target_keywords
        )

        overlap = (
            len(common_keywords)
            / len(source_keywords)
        )

        return float(overlap), common_keywords

    @staticmethod
    def _create_reason(
        similarity_score: float,
        keyword_overlap: float,
        same_module: bool,
        common_keywords: list[str],
    ) -> str:
        parts = [
            (
                "Değişen gereksinim ile bu gereksinim arasında "
                f"{similarity_score:.2f} anlamsal benzerlik bulundu."
            )
        ]

        if keyword_overlap > 0:
            parts.append(
                f"Anahtar kelime örtüşmesi {keyword_overlap:.2f}."
            )

        if common_keywords:
            parts.append(
                "Ortak terimler: "
                + ", ".join(common_keywords[:5])
                + "."
            )

        if same_module:
            parts.append(
                "İki gereksinim aynı modülde bulunuyor."
            )

        parts.append(
            "Bu sonuç kesin bir etki ilişkisi değildir; "
            "incelenmesi gereken potansiyel bir etki adayıdır."
        )

        return " ".join(parts)

    @staticmethod
    def _result_columns() -> list[str]:
        return [
            "source_requirement_id",
            "target_requirement_id",
            "source_module",
            "target_module",
            "similarity_score",
            "keyword_overlap",
            "same_module",
            "impact_score",
            "reason",
            "rank",
        ]

    def analyze(
        self,
        dataframe: pd.DataFrame,
        changed_requirement_id: str,
        top_k: int = 5,
        min_impact: float = 0.0,
    ) -> pd.DataFrame:
        """
        Değişen bir gereksinim için potansiyel etki
        adaylarını sıralar.
        """

        self._validate_dataframe(
            dataframe
        )

        if top_k <= 0:
            raise ValueError(
                "top_k sıfırdan büyük olmalıdır."
            )

        if not 0.0 <= min_impact <= 1.0:
            raise ValueError(
                "min_impact 0 ile 1 arasında olmalıdır."
            )

        prepared_data = (
            dataframe
            .copy()
            .reset_index(drop=True)
        )

        prepared_data["requirement_id"] = (
            prepared_data["requirement_id"]
            .astype(str)
            .str.strip()
        )

        source_id = str(
            changed_requirement_id
        ).strip()

        source_data = prepared_data[
            prepared_data["requirement_id"]
            == source_id
        ].copy()

        if source_data.empty:
            raise ValueError(
                f"Gereksinim bulunamadı: {source_id}"
            )

        candidate_data = prepared_data[
            prepared_data["requirement_id"]
            != source_id
        ].copy()

        if candidate_data.empty:
            return pd.DataFrame(
                columns=self._result_columns()
            )

        source_row = source_data.iloc[0]

        source_text = str(
            source_row["requirement_text"]
        )

        source_module = str(
            source_row["module"]
        ).strip()

        self.matcher.fit(
            candidate_data
        )

        match_results = self.matcher.match_dataframe(
            source_data,
            top_k=len(candidate_data),
            min_score=0.0,
        )

        candidate_lookup = (
            candidate_data
            .set_index("requirement_id")
        )

        candidates: list[
            ImpactCandidate
        ] = []

        for _, match in match_results.iterrows():
            target_id = str(
                match["candidate_requirement_id"]
            ).strip()

            if target_id not in candidate_lookup.index:
                continue

            target_row = candidate_lookup.loc[
                target_id
            ]

            target_text = str(
                target_row["requirement_text"]
            )

            target_module = str(
                target_row["module"]
            ).strip()

            similarity_score = max(
                0.0,
                min(
                    1.0,
                    float(
                        match["similarity_score"]
                    ),
                ),
            )

            (
                keyword_overlap,
                common_keywords,
            ) = self._keyword_overlap(
                source_text,
                target_text,
            )

            same_module = (
                source_module.lower()
                == target_module.lower()
            )

            module_component = (
                1.0
                if same_module
                else 0.0
            )

            impact_score = (
                self.semantic_weight
                * similarity_score
                + self.keyword_weight
                * keyword_overlap
                + self.module_weight
                * module_component
            )

            impact_score = max(
                0.0,
                min(
                    1.0,
                    impact_score,
                ),
            )

            if impact_score < min_impact:
                continue

            candidates.append(
                ImpactCandidate(
                    source_requirement_id=source_id,
                    target_requirement_id=target_id,
                    source_module=source_module,
                    target_module=target_module,
                    similarity_score=round(
                        similarity_score,
                        4,
                    ),
                    keyword_overlap=round(
                        keyword_overlap,
                        4,
                    ),
                    same_module=same_module,
                    impact_score=round(
                        impact_score,
                        4,
                    ),
                    reason=self._create_reason(
                        similarity_score,
                        keyword_overlap,
                        same_module,
                        common_keywords,
                    ),
                    rank=0,
                )
            )

        candidates.sort(
            key=lambda candidate: (
                candidate.impact_score,
                candidate.similarity_score,
            ),
            reverse=True,
        )

        ranked_candidates: list[
            ImpactCandidate
        ] = []

        for rank, candidate in enumerate(
            candidates[:top_k],
            start=1,
        ):
            ranked_candidates.append(
                ImpactCandidate(
                    source_requirement_id=(
                        candidate.source_requirement_id
                    ),
                    target_requirement_id=(
                        candidate.target_requirement_id
                    ),
                    source_module=(
                        candidate.source_module
                    ),
                    target_module=(
                        candidate.target_module
                    ),
                    similarity_score=(
                        candidate.similarity_score
                    ),
                    keyword_overlap=(
                        candidate.keyword_overlap
                    ),
                    same_module=(
                        candidate.same_module
                    ),
                    impact_score=(
                        candidate.impact_score
                    ),
                    reason=candidate.reason,
                    rank=rank,
                )
            )

        return pd.DataFrame(
            [
                candidate.to_dict()
                for candidate in ranked_candidates
            ],
            columns=self._result_columns(),
        )