from __future__ import annotations

from dataclasses import asdict, dataclass
from enum import Enum

from backend.app.comparison.change_analyzer import (
    DetectedChange,
    DetailedChangeType,
)
from backend.app.comparison.change_detector import ChangeType


class RiskLevel(str, Enum):
    """ScopeDiff risk seviyeleri."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass(frozen=True)
class RiskFactor:
    """Risk skoruna katkıda bulunan bir değişiklik."""

    change_type: str
    weight: int
    old_value: str | None
    new_value: str | None
    explanation: str


@dataclass(frozen=True)
class RiskAssessment:
    """Bir gereksinim değişikliği için risk değerlendirmesi."""

    risk_score: int
    risk_level: RiskLevel
    confidence: float
    explanation: str
    factors: tuple[RiskFactor, ...]

    def to_dict(self) -> dict[str, object]:
        return {
            "risk_score": self.risk_score,
            "risk_level": self.risk_level.value,
            "confidence": self.confidence,
            "explanation": self.explanation,
            "factors": [
                asdict(factor)
                for factor in self.factors
            ],
        }


class RequirementRiskScorer:
    """
    Gereksinim değişiklikleri için açıklanabilir risk skoru üretir.

    Risk score:
        Değişikliğin potansiyel etkisini temsil eder.

    Confidence:
        Sistemin değişiklik sınıflandırmasına yönelik sezgisel
        güven seviyesidir. İstatistiksel olarak kalibre edilmiş
        bir olasılık değildir.
    """

    BASE_CHANGE_WEIGHTS = {
        ChangeType.UNCHANGED.value: 0,
        ChangeType.PARAPHRASED.value: 5,
        ChangeType.CHANGED.value: 15,
        ChangeType.ADDED.value: 30,
        ChangeType.REMOVED.value: 35,
    }

    DETAIL_CHANGE_WEIGHTS = {
        DetailedChangeType.NUMERIC.value: 20,
        DetailedChangeType.DURATION.value: 20,
        DetailedChangeType.MODALITY.value: 30,
        DetailedChangeType.NEGATION.value: 35,
        DetailedChangeType.CONDITION.value: 25,
        DetailedChangeType.SCOPE.value: 25,
        DetailedChangeType.ACTOR.value: 20,
        DetailedChangeType.STATE.value: 20,
    }

    BASE_EXPLANATIONS = {
        ChangeType.UNCHANGED.value: (
            "Gereksinimde anlamlı bir içerik değişikliği "
            "tespit edilmedi."
        ),
        ChangeType.PARAPHRASED.value: (
            "Gereksinim farklı bir biçimde ifade edilmiş "
            "görünüyor."
        ),
        ChangeType.CHANGED.value: (
            "Gereksinimin davranışını etkileyebilecek bir "
            "içerik değişikliği tespit edildi."
        ),
        ChangeType.ADDED.value: (
            "Yeni bir gereksinim eklendi."
        ),
        ChangeType.REMOVED.value: (
            "Önceki sürümde bulunan gereksinim yeni sürümde "
            "eşleşmedi ve kaldırılmış olarak değerlendirildi."
        ),
    }

    MODALITY_TRANSLATIONS = {
        "mandatory": "zorunlu",
        "optional": "opsiyonel",
        "prohibited": "yasak",
    }

    @classmethod
    def _normalize_base_change_type(
        cls,
        change_type: str | ChangeType,
    ) -> str:
        if isinstance(change_type, ChangeType):
            normalized = change_type.value
        else:
            normalized = str(change_type).strip().lower()

        if normalized not in cls.BASE_CHANGE_WEIGHTS:
            raise ValueError(
                f"Desteklenmeyen temel değişiklik türü: {normalized}"
            )

        return normalized

    @staticmethod
    def _get_risk_level(
        risk_score: int,
    ) -> RiskLevel:
        if risk_score >= 80:
            return RiskLevel.CRITICAL

        if risk_score >= 60:
            return RiskLevel.HIGH

        if risk_score >= 30:
            return RiskLevel.MEDIUM

        return RiskLevel.LOW

    @classmethod
    def _translate_value(
        cls,
        change_type: str,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        if change_type != DetailedChangeType.MODALITY.value:
            return value

        translated_parts: list[str] = []

        for part in value.split(","):
            cleaned = part.strip()

            translated_parts.append(
                cls.MODALITY_TRANSLATIONS.get(
                    cleaned,
                    cleaned,
                )
            )

        return ", ".join(translated_parts)

    @classmethod
    def _create_factor(
        cls,
        change: DetectedChange,
    ) -> RiskFactor:
        change_type = change.change_type.value

        old_value = cls._translate_value(
            change_type,
            change.old_value,
        )

        new_value = cls._translate_value(
            change_type,
            change.new_value,
        )

        labels = {
            DetailedChangeType.NUMERIC.value:
                "Sayısal değer",
            DetailedChangeType.DURATION.value:
                "Süre",
            DetailedChangeType.MODALITY.value:
                "Zorunluluk seviyesi",
            DetailedChangeType.NEGATION.value:
                "Olumsuzluk yapısı",
            DetailedChangeType.CONDITION.value:
                "Koşul",
            DetailedChangeType.SCOPE.value:
                "Kapsam",
            DetailedChangeType.ACTOR.value:
                "Aktör",
            DetailedChangeType.STATE.value:
                "Durum",
        }

        label = labels.get(
            change_type,
            "Gereksinim özelliği",
        )

        explanation = (
            f"{label} değişti: "
            f"{old_value or 'yok'} → "
            f"{new_value or 'yok'}."
        )

        return RiskFactor(
            change_type=change_type,
            weight=cls.DETAIL_CHANGE_WEIGHTS[
                change_type
            ],
            old_value=old_value,
            new_value=new_value,
            explanation=explanation,
        )

    @staticmethod
    def _calculate_confidence(
        base_change_type: str,
        similarity_score: float,
        match_strategy: str,
        detail_count: int,
    ) -> float:
        """
        Sezgisel confidence değeri üretir.

        Bu değer kalibre edilmiş olasılık değildir.
        """

        if base_change_type == ChangeType.UNCHANGED.value:
            return round(
                max(similarity_score, 0.98),
                2,
            )

        if base_change_type in {
            ChangeType.ADDED.value,
            ChangeType.REMOVED.value,
        }:
            return 0.90

        matching_confidence = similarity_score

        if match_strategy == "requirement_id":
            matching_confidence = max(
                matching_confidence,
                0.95,
            )

        detail_confidence = min(
            0.96,
            0.78 + (0.04 * detail_count),
        )

        confidence = (
            0.70 * matching_confidence
            + 0.30 * detail_confidence
        )

        return round(
            max(
                0.0,
                min(1.0, confidence),
            ),
            2,
        )

    def assess(
        self,
        base_change_type: str | ChangeType,
        similarity_score: float,
        detailed_changes: list[DetectedChange] | None = None,
        match_strategy: str = "text_similarity",
    ) -> RiskAssessment:
        """
        Bir değişiklik için risk değerlendirmesi oluşturur.
        """

        if not 0.0 <= similarity_score <= 1.0:
            raise ValueError(
                "similarity_score 0 ile 1 arasında olmalıdır."
            )

        normalized_base_type = (
            self._normalize_base_change_type(
                base_change_type
            )
        )

        detailed_changes = detailed_changes or []

        factors: list[RiskFactor] = []

        seen_change_types: set[str] = set()

        for change in detailed_changes:
            change_type = change.change_type.value

            if change_type in seen_change_types:
                continue

            if change_type not in self.DETAIL_CHANGE_WEIGHTS:
                continue

            factors.append(
                self._create_factor(change)
            )

            seen_change_types.add(change_type)

        risk_score = self.BASE_CHANGE_WEIGHTS[
            normalized_base_type
        ]

        risk_score += sum(
            factor.weight
            for factor in factors
        )

        risk_score = min(
            100,
            risk_score,
        )

        risk_level = self._get_risk_level(
            risk_score
        )

        confidence = self._calculate_confidence(
            base_change_type=normalized_base_type,
            similarity_score=similarity_score,
            match_strategy=match_strategy,
            detail_count=len(factors),
        )

        explanation_parts = [
            self.BASE_EXPLANATIONS[
                normalized_base_type
            ]
        ]

        explanation_parts.extend(
            factor.explanation
            for factor in factors
        )

        explanation_parts.append(
            (
                f"Toplam risk skoru {risk_score}/100 "
                f"ve risk seviyesi "
                f"{risk_level.value.upper()}."
            )
        )

        explanation = " ".join(
            explanation_parts
        )

        return RiskAssessment(
            risk_score=risk_score,
            risk_level=risk_level,
            confidence=confidence,
            explanation=explanation,
            factors=tuple(factors),
        )