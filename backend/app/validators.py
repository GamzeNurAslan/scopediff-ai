from collections.abc import Iterable

import pandas as pd


REQUIRED_REQUIREMENT_COLUMNS = {
    "requirement_id",
    "requirement_text",
    "module",
    "version",
}


class DataValidationError(ValueError):
    """Veri doğrulama sırasında bulunan hataları temsil eder."""

    def __init__(self, errors: Iterable[str]) -> None:
        self.errors = list(errors)
        message = "\n".join(f"- {error}" for error in self.errors)
        super().__init__(message)


def _get_blank_mask(series: pd.Series) -> pd.Series:
    """Bir sütundaki None, NaN ve boş metin değerlerini bulur."""
    return series.isna() | series.astype(str).str.strip().eq("")


def validate_requirements_dataframe(dataframe: pd.DataFrame) -> None:
    """
    Gereksinim tablosunun beklenen veri yapısına uygunluğunu kontrol eder.

    Başarılı doğrulamada herhangi bir değer döndürmez.
    Hata bulunduğunda DataValidationError oluşturur.
    """
    errors: list[str] = []

    if not isinstance(dataframe, pd.DataFrame):
        raise TypeError("Doğrulanacak veri bir pandas DataFrame olmalıdır.")

    if dataframe.empty:
        errors.append("Dosya en az bir gereksinim içermelidir.")

    missing_columns = REQUIRED_REQUIREMENT_COLUMNS - set(dataframe.columns)

    if missing_columns:
        columns = ", ".join(sorted(missing_columns))
        errors.append(f"Eksik zorunlu sütunlar: {columns}")

        raise DataValidationError(errors)

    blank_requirement_texts = _get_blank_mask(dataframe["requirement_text"])
    if blank_requirement_texts.any():
        errors.append(
            f"{int(blank_requirement_texts.sum())} satırda requirement_text boş."
        )

    blank_requirement_ids = _get_blank_mask(dataframe["requirement_id"])
    valid_ids = dataframe.loc[~blank_requirement_ids, "requirement_id"].astype(str).str.strip()

    duplicate_ids = sorted(
        valid_ids[valid_ids.duplicated(keep=False)].unique().tolist()
    )

    if duplicate_ids:
        errors.append(
            "Tekrarlanan requirement_id değerleri: "
            + ", ".join(duplicate_ids)
        )

    blank_modules = _get_blank_mask(dataframe["module"])
    if blank_modules.any():
        errors.append(
            f"{int(blank_modules.sum())} satırda module boş."
        )

    blank_versions = _get_blank_mask(dataframe["version"])
    if blank_versions.any():
        errors.append(
            f"{int(blank_versions.sum())} satırda version boş."
        )

    if errors:
        raise DataValidationError(errors)
