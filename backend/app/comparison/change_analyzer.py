from __future__ import annotations

import re
from dataclasses import asdict, dataclass
from enum import Enum

from backend.app.text_preprocessor import normalize_text


class DetailedChangeType(str, Enum):
    NUMERIC = "numeric_change"
    DURATION = "duration_change"
    MODALITY = "modality_change"
    NEGATION = "negation_change"
    CONDITION = "condition_change"
    SCOPE = "scope_change"
    ACTOR = "actor_change"
    STATE = "state_change"


@dataclass(frozen=True)
class DetectedChange:
    change_type: DetailedChangeType
    old_value: str | None
    new_value: str | None
    explanation: str

    def to_dict(self) -> dict[str, object]:
        result = asdict(self)
        result["change_type"] = self.change_type.value
        return result


class RequirementChangeAnalyzer:
    """
    İki gereksinim metni arasındaki önemli iş kuralı
    değişikliklerini kural tabanlı olarak tespit eder.
    """

    DURATION_PATTERN = re.compile(
        r"(?P<value>\d+(?:[.,]\d+)?)\s*"
        r"(?P<unit>"
        r"saniye|sn|dakika|dk|saat|gün|hafta|ay|yıl"
        r")\b"
    )

    NUMBER_PATTERN = re.compile(
        r"(?<!\w)%?\d+(?:[.,]\d+)?(?!\w)"
    )

    CONDITION_TERMS = (
        "eğer",
        "ise",
        "durumunda",
        "halinde",
        "hâlinde",
        "şartıyla",
        "koşuluyla",
        "olduğunda",
        "if",
        "when",
        "unless",
    )

    SCOPE_TERMS = (
        "tüm",
        "bütün",
        "her",
        "yalnızca",
        "sadece",
        "en az",
        "en fazla",
        "hiçbir",
        "bazı",
        "tek",
    )

    ACTOR_TERMS = (
        "kurumsal müşteri",
        "bireysel müşteri",
        "müşteri temsilcisi",
        "sistem yöneticisi",
        "müşteri",
        "kullanıcı",
        "operatör",
        "yönetici",
        "admin",
        "teknisyen",
        "sistem",
    )

    STATE_TERMS = (
        "aktif",
        "pasif",
        "beklemede",
        "askıda",
        "iptal",
        "tamamlandı",
        "onaylı",
        "reddedildi",
        "başarılı",
        "başarısız",
        "açık",
        "kapalı",
    )

    MANDATORY_PATTERN = re.compile(
        r"\b(?:"
        r"zorunlu(?:dur)?|"
        r"gerekir|"
        r"gerekmektedir|"
        r"şarttır|"
        r"[\wçğıöşü]+(?:malı|meli)"
        r"(?:dır|dir|dur|dür|tır|tir|tur|tür)?"
        r")\b"
    )

    OPTIONAL_PATTERN = re.compile(
        r"\b(?:"
        r"opsiyonel|"
        r"isteğe bağlı|"
        r"tercihe bağlı|"
        r"[\wçğıöşü]+(?:abilir|ebilir)"
        r"(?:dır|dir|dur|dür)?"
        r")\b"
    )

    PROHIBITED_PATTERN = re.compile(
        r"\b(?:"
        r"yasaktır|"
        r"izin verilmez|"
        r"izin verilmemelidir|"
        r"[\wçğıöşü]+(?:mamalı|memeli)"
        r"(?:dır|dir|dur|dür|tır|tir|tur|tür)?"
        r")\b"
    )

    NEGATION_PATTERN = re.compile(
        r"\b(?:"
        r"değil|"
        r"değildir|"
        r"yok|"
        r"yasak(?:tır)?|"
        r"izin verilmez|"
        r"[\wçğıöşü]+(?:mamalı|memeli|maz|mez)"
        r"(?:dır|dir|dur|dür)?"
        r")\b"
    )

    @staticmethod
    def _format_values(values: list[str]) -> str | None:
        if not values:
            return None

        return ", ".join(values)

    @staticmethod
    def _extract_terms(
        text: str,
        terms: tuple[str, ...],
    ) -> list[str]:
        """
        Belirlenen kavramları metinden çıkarır.

        Uzun ifadeler önce kontrol edilir. Böylece
        'kurumsal müşteri' bulunduğunda ayrıca 'müşteri'
        sonucu üretmemeye çalışırız.
        """
        found: list[str] = []

        for term in sorted(
            terms,
            key=len,
            reverse=True,
        ):
            pattern = re.compile(
                rf"(?<!\w){re.escape(term)}\w*",
            )

            if pattern.search(text):
                if any(
                    term in existing
                    for existing in found
                ):
                    continue

                found.append(term)

        return sorted(found)

    @classmethod
    def _extract_durations(
        cls,
        text: str,
    ) -> list[str]:
        durations: list[str] = []

        for match in cls.DURATION_PATTERN.finditer(text):
            value = match.group("value").replace(",", ".")
            unit = match.group("unit")

            durations.append(
                f"{value} {unit}"
            )

        return durations

    @classmethod
    def _extract_numbers(
        cls,
        text: str,
    ) -> list[str]:
        """
        Süre ifadelerinin içindeki sayıları hariç tutarak
        diğer sayısal değerleri çıkarır.
        """
        text_without_durations = (
            cls.DURATION_PATTERN.sub(
                " ",
                text,
            )
        )

        return cls.NUMBER_PATTERN.findall(
            text_without_durations
        )

    @classmethod
    def _detect_modality(
        cls,
        text: str,
    ) -> list[str]:
        modalities: list[str] = []

        if cls.PROHIBITED_PATTERN.search(text):
            modalities.append("prohibited")

        if cls.MANDATORY_PATTERN.search(text):
            modalities.append("mandatory")

        if cls.OPTIONAL_PATTERN.search(text):
            modalities.append("optional")

        return modalities

    @classmethod
    def _has_negation(
        cls,
        text: str,
    ) -> bool:
        return bool(
            cls.NEGATION_PATTERN.search(text)
        )

    @staticmethod
    def _create_change(
        change_type: DetailedChangeType,
        old_values: list[str],
        new_values: list[str],
        label: str,
    ) -> DetectedChange:
        old_value = (
            ", ".join(old_values)
            if old_values
            else None
        )

        new_value = (
            ", ".join(new_values)
            if new_values
            else None
        )

        return DetectedChange(
            change_type=change_type,
            old_value=old_value,
            new_value=new_value,
            explanation=(
                f"{label} değişti: "
                f"{old_value or 'yok'} → "
                f"{new_value or 'yok'}"
            ),
        )

    def analyze(
        self,
        old_text: object,
        new_text: object,
    ) -> list[DetectedChange]:
        """
        İki gereksinim arasındaki özel değişiklikleri tespit eder.
        """

        old_normalized = normalize_text(old_text)
        new_normalized = normalize_text(new_text)

        if not old_normalized or not new_normalized:
            return []

        if old_normalized == new_normalized:
            return []

        changes: list[DetectedChange] = []

        # 1. Süre değişiklikleri
        old_durations = self._extract_durations(
            old_normalized
        )

        new_durations = self._extract_durations(
            new_normalized
        )

        if old_durations != new_durations:
            if old_durations or new_durations:
                changes.append(
                    self._create_change(
                        DetailedChangeType.DURATION,
                        old_durations,
                        new_durations,
                        "Süre",
                    )
                )

        # 2. Sayısal değişiklikler
        old_numbers = self._extract_numbers(
            old_normalized
        )

        new_numbers = self._extract_numbers(
            new_normalized
        )

        if old_numbers != new_numbers:
            if old_numbers or new_numbers:
                changes.append(
                    self._create_change(
                        DetailedChangeType.NUMERIC,
                        old_numbers,
                        new_numbers,
                        "Sayısal değer",
                    )
                )

        # 3. Modality / zorunluluk
        old_modality = self._detect_modality(
            old_normalized
        )

        new_modality = self._detect_modality(
            new_normalized
        )

        if old_modality != new_modality:
            if old_modality or new_modality:
                changes.append(
                    self._create_change(
                        DetailedChangeType.MODALITY,
                        old_modality,
                        new_modality,
                        "Zorunluluk seviyesi",
                    )
                )

        # 4. Olumsuzluk
        old_negation = self._has_negation(
            old_normalized
        )

        new_negation = self._has_negation(
            new_normalized
        )

        if old_negation != new_negation:
            changes.append(
                DetectedChange(
                    change_type=DetailedChangeType.NEGATION,
                    old_value=(
                        "present"
                        if old_negation
                        else "absent"
                    ),
                    new_value=(
                        "present"
                        if new_negation
                        else "absent"
                    ),
                    explanation=(
                        "Olumsuzluk yapısı değişti: "
                        f"{'var' if old_negation else 'yok'} → "
                        f"{'var' if new_negation else 'yok'}"
                    ),
                )
            )

        # 5. Koşul değişiklikleri
        old_conditions = self._extract_terms(
            old_normalized,
            self.CONDITION_TERMS,
        )

        new_conditions = self._extract_terms(
            new_normalized,
            self.CONDITION_TERMS,
        )

        if old_conditions != new_conditions:
            changes.append(
                self._create_change(
                    DetailedChangeType.CONDITION,
                    old_conditions,
                    new_conditions,
                    "Koşul",
                )
            )

        # 6. Kapsam değişiklikleri
        old_scope = self._extract_terms(
            old_normalized,
            self.SCOPE_TERMS,
        )

        new_scope = self._extract_terms(
            new_normalized,
            self.SCOPE_TERMS,
        )

        if old_scope != new_scope:
            changes.append(
                self._create_change(
                    DetailedChangeType.SCOPE,
                    old_scope,
                    new_scope,
                    "Kapsam",
                )
            )

        # 7. Aktör değişiklikleri
        old_actors = self._extract_terms(
            old_normalized,
            self.ACTOR_TERMS,
        )

        new_actors = self._extract_terms(
            new_normalized,
            self.ACTOR_TERMS,
        )

        if old_actors != new_actors:
            if old_actors or new_actors:
                changes.append(
                    self._create_change(
                        DetailedChangeType.ACTOR,
                        old_actors,
                        new_actors,
                        "Aktör",
                    )
                )

        # 8. Durum / state değişiklikleri
        old_states = self._extract_terms(
            old_normalized,
            self.STATE_TERMS,
        )

        new_states = self._extract_terms(
            new_normalized,
            self.STATE_TERMS,
        )

        if old_states != new_states:
            if old_states or new_states:
                changes.append(
                    self._create_change(
                        DetailedChangeType.STATE,
                        old_states,
                        new_states,
                        "Durum",
                    )
                )

        return changes