import re
from pathlib import Path

import pandas as pd

from backend.app.text_preprocessor import preprocess_text
from backend.app.validators import validate_requirements_dataframe


class FileLoadingError(ValueError):
    """Excel dosyası okunamadığında oluşan hatayı temsil eder."""


def standardize_column_name(column_name: object) -> str:
    """
    Sütun adlarını standart formata dönüştürür.

    Örnek:
    'Requirement ID' -> 'requirement_id'
    'Requirement-Text' -> 'requirement_text'
    """
    name = str(column_name).strip().lower()
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