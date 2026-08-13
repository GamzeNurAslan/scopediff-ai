import re
from pathlib import Path

import pandas as pd

from backend.app.text_preprocessor import preprocess_text
from backend.app.validators import validate_requirements_dataframe


class FileLoadingError(ValueError):
    """Excel dosyası okunamadığında oluşan hatayı temsil eder."""


REQUIREMENT_COLUMN_ALIASES = {
    "requirement_id": {
        "requirementid", "reqid", "id", "kod", "gereksinimid", "gereksinimno", "ref", "key",
    },
    "requirement_text": {
        "requirementtext", "requirement", "description", "details", "text", "aciklama", "gereksinim", "gereksinimmetni", "isregeli", "isgereksinimi",
    },
    "module": {
        "module", "component", "area", "category", "modul", "menu", "menukategori", "fonksiyon",
    },
    "version": {
        "version", "release", "sprint", "versiyon", "surum", "surumno",
    },
}


def _header_key(value: object) -> str:
    text = str(value).strip().lower()
    replacements = str.maketrans("ıişğüöç", "iisguoc")
    text = text.translate(replacements)
    return re.sub(r"[^a-z0-9]+", "", text)


def detect_requirement_columns(columns: list[object]) -> dict[str, str | None]:
    """Farklı şirket kolon adlarını ScopeDiff alanlarına eşler."""
    normalized = {_header_key(column): str(column) for column in columns}
    mapping: dict[str, str | None] = {}

    for canonical, aliases in REQUIREMENT_COLUMN_ALIASES.items():
        mapping[canonical] = next(
            (normalized[alias] for alias in aliases if alias in normalized),
            None,
        )

    return mapping


def standardize_column_name(column_name: object) -> str:
    """
    Sütun adlarını standart formata dönüştürür.

    Örnek:
    'Requirement ID' -> 'requirement_id'
    'Requirement-Text' -> 'requirement_text'
    """
    name = str(column_name).strip().lower()
    name = name.translate(str.maketrans("ıişğüöç", "iisguoc"))
    name = re.sub(r"[\s\-]+", "_", name)
    name = re.sub(r"[^a-z0-9_]", "", name)
    name = re.sub(r"_+", "_", name)

    return name.strip("_")


def standardize_column_names(dataframe: pd.DataFrame) -> pd.DataFrame:
    """DataFrame sütunlarının standartlaştırılmış bir kopyasını döndürür."""
    result = dataframe.copy()
    result.columns = [
        standardize_column_name(column)
        for column in result.columns
    ]

    return result


def load_requirements_excel(
    file_path: str | Path,
    sheet_name: str | int = 0,
    column_mapping: dict[str, str] | None = None,
    version_fallback: str | None = None,
) -> pd.DataFrame:
    """
    Gereksinim Excel dosyasını okur, doğrular ve metinleri işler.

    Dönen tabloda şu ek sütunlar bulunur:

    - original_text
    - normalized_text
    """
    path = Path(file_path)

    if not path.exists():
        raise FileLoadingError(f"Dosya bulunamadı: {path}")

    if path.suffix.lower() != ".xlsx":
        raise FileLoadingError(
            "Yalnızca .xlsx uzantılı Excel dosyaları desteklenmektedir."
        )

    try:
        dataframe = pd.read_excel(
            path,
            sheet_name=sheet_name,
            engine="openpyxl",
        )
    except ValueError as error:
        raise FileLoadingError(
            f"Excel çalışma sayfası okunamadı: {error}"
        ) from error
    except Exception as error:
        raise FileLoadingError(
            f"Excel dosyası okunamadı: {error}"
        ) from error

    dataframe = standardize_column_names(dataframe)

    detected_mapping = detect_requirement_columns(list(dataframe.columns))
    selected_mapping = {
        **detected_mapping,
        **(column_mapping or {}),
    }

    text_column = selected_mapping.get("requirement_text")
    if not text_column or text_column not in dataframe.columns:
        raise FileLoadingError(
            "Gereksinim metni kolonu bulunamadı. "
            "Description, Requirement veya Açıklama benzeri bir kolon seçin."
        )

    rename_map = {
        source: canonical
        for canonical, source in selected_mapping.items()
        if source and source in dataframe.columns
    }
    dataframe = dataframe.rename(columns=rename_map)

    row_count = len(dataframe.index)
    if "requirement_id" not in dataframe.columns:
        dataframe["requirement_id"] = ""
    dataframe["requirement_id"] = dataframe["requirement_id"].fillna("")
    blank_ids = dataframe["requirement_id"].astype(str).str.strip().eq("")
    dataframe.loc[blank_ids, "requirement_id"] = [
        f"AUTO-{index:04d}"
        for index in range(1, int(blank_ids.sum()) + 1)
    ]
    validate_requirements_dataframe(dataframe)

    processed_texts = dataframe["requirement_text"].apply(preprocess_text)

    dataframe["original_text"] = processed_texts.apply(
        lambda item: item["original_text"]
    )
    dataframe["normalized_text"] = processed_texts.apply(
        lambda item: item["normalized_text"]
    )

    dataframe["requirement_id"] = (
        dataframe["requirement_id"]
        .astype(str)
        .str.strip()
    )

    dataframe["module"] = (
        dataframe["module"]
        .astype(str)
        .str.strip()
    )

    dataframe["version"] = (
        dataframe["version"]
        .astype(str)
        .str.strip()
    )

    return dataframe
