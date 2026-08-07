from __future__ import annotations

import re
from typing import Any

import pandas as pd


class RequirementVersionHistory:
    """
    Bir gereksinimin versiyon geçmişini ve timeline bilgisini oluşturur.
    """

    REQUIRED_COLUMNS = {
        "requirement_id",
        "version",
        "requirement_text",
        "module",
        "previous_version",
        "transition_id",
        "change_type_from_previous",
        "risk_from_previous",
        "change_explanation",
        "is_current_version",
    }

    RISK_ORDER = {
        "low": 1,
        "medium": 2,
        "high": 3,
        "critical": 4,
    }

    @classmethod
    def _validate_dataframe(
        cls,
        dataframe: pd.DataFrame,
    ) -> None:
        """Version history DataFrame yapısını doğrular."""

        if not isinstance(dataframe, pd.DataFrame):
            raise TypeError(
                "Version history verisi pandas DataFrame olmalıdır."
            )

        if dataframe.empty:
            raise ValueError(
                "Version history tablosu boş olamaz."
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
                f"Eksik version history sütunları: {missing}"
            )

    @staticmethod
    def _safe_optional_text(
        value: Any,
    ) -> str | None:
        """None ve NaN değerlerini güvenli şekilde işler."""

        if value is None:
            return None

        try:
            if pd.isna(value):
                return None
        except (TypeError, ValueError):
            pass

        cleaned = str(value).strip()

        return cleaned or None

    @staticmethod
    def _version_sort_key(
        version: object,
    ) -> tuple[int, ...]:
        """
        1.0, 2.0, v3 gibi versiyonları sıralanabilir hale getirir.
        """

        text = str(version).strip()

        numbers = re.findall(
            r"\d+",
            text,
        )

        if not numbers:
            return (0,)

        return tuple(
            int(number)
            for number in numbers
        )

    @classmethod
    def _highest_risk(
        cls,
        risks: list[str],
    ) -> str | None:
        """Timeline üzerindeki en yüksek risk seviyesini döndürür."""

        valid_risks = [
            risk.lower()
            for risk in risks
            if risk.lower() in cls.RISK_ORDER
        ]

        if not valid_risks:
            return None

        return max(
            valid_risks,
            key=lambda risk: cls.RISK_ORDER[risk],
        )

    def get_history(
        self,
        dataframe: pd.DataFrame,
        requirement_id: str,
    ) -> pd.DataFrame:
        """
        Tek bir requirement_id için sıralı versiyon geçmişini döndürür.
        """

        self._validate_dataframe(
            dataframe
        )

        normalized_id = str(
            requirement_id
        ).strip()

        history = dataframe[
            dataframe["requirement_id"]
            .astype(str)
            .str.strip()
            .eq(normalized_id)
        ].copy()

        if history.empty:
            raise ValueError(
                f"Gereksinim bulunamadı: {normalized_id}"
            )

        history["_version_sort_key"] = (
            history["version"]
            .apply(self._version_sort_key)
        )

        history = (
            history
            .sort_values(
                by="_version_sort_key"
            )
            .drop(
                columns=["_version_sort_key"]
            )
            .reset_index(drop=True)
        )

        return history

    def get_summary(
        self,
        dataframe: pd.DataFrame,
        requirement_id: str,
    ) -> dict[str, object]:
        """
        Gereksinimin versiyon geçmişini özetler.
        """

        history = self.get_history(
            dataframe,
            requirement_id,
        )

        first_row = history.iloc[0]
        latest_row = history.iloc[-1]

        change_types: list[str] = []

        risks: list[str] = []

        transition_count = 0

        for _, row in history.iterrows():
            transition_id = self._safe_optional_text(
                row["transition_id"]
            )

            change_type = self._safe_optional_text(
                row["change_type_from_previous"]
            )

            risk = self._safe_optional_text(
                row["risk_from_previous"]
            )

            if transition_id is not None:
                transition_count += 1

            if (
                change_type is not None
                and change_type.lower() != "baseline"
                and change_type not in change_types
            ):
                change_types.append(
                    change_type
                )

            if risk is not None:
                risks.append(
                    risk
                )

        return {
            "requirement_id": str(
                first_row["requirement_id"]
            ).strip(),
            "module": str(
                first_row["module"]
            ).strip(),
            "first_version": str(
                first_row["version"]
            ),
            "latest_version": str(
                latest_row["version"]
            ),
            "version_count": len(history),
            "transition_count": transition_count,
            "highest_risk": self._highest_risk(
                risks
            ),
            "change_types": change_types,
            "current_text": str(
                latest_row["requirement_text"]
            ),
        }

    def build_timeline(
        self,
        dataframe: pd.DataFrame,
        requirement_id: str,
    ) -> pd.DataFrame:
        """
        Frontend timeline bileşeninin kullanabileceği sade veri üretir.
        """

        history = self.get_history(
            dataframe,
            requirement_id,
        )

        timeline_rows: list[
            dict[str, object]
        ] = []

        for index, row in history.iterrows():
            transition_id = self._safe_optional_text(
                row["transition_id"]
            )

            change_type = self._safe_optional_text(
                row["change_type_from_previous"]
            )

            risk_level = self._safe_optional_text(
                row["risk_from_previous"]
            )

            explanation = self._safe_optional_text(
                row["change_explanation"]
            )

            previous_version = self._safe_optional_text(
                row["previous_version"]
            )

            timeline_rows.append(
                {
                    "requirement_id": str(
                        row["requirement_id"]
                    ).strip(),
                    "module": str(
                        row["module"]
                    ).strip(),
                    "version": str(
                        row["version"]
                    ),
                    "version_label": (
                        f"v{row['version']}"
                    ),
                    "requirement_text": str(
                        row["requirement_text"]
                    ),
                    "previous_version":
                        previous_version,
                    "transition_id":
                        transition_id,
                    "change_type": (
                        change_type
                        if change_type
                        else "baseline"
                    ),
                    "risk_level": (
                        risk_level
                        if risk_level
                        else "none"
                    ),
                    "change_explanation": (
                        explanation
                        if explanation
                        else "Initial version."
                    ),
                    "is_initial_version": (
                        index == 0
                    ),
                    "is_current_version": bool(
                        row["is_current_version"]
                    ),
                }
            )

        return pd.DataFrame(
            timeline_rows
        )