import pandas as pd
import pytest

from backend.app.data_loader import (
    FileLoadingError,
    load_requirements_excel,
    standardize_column_name,
)

from backend.app.validators import (
    DataValidationError,
    validate_requirements_dataframe,
)

from backend.app.text_preprocessor import (
    clean_original_text,
    normalize_text,
    preprocess_text,
)


def test_clean_original_text_removes_extra_whitespace() -> None:
    text = "  Port kontrolü   en fazla 3 kez\ntekrarlanmalıdır.  "

    result = clean_original_text(text)

    assert result == "Port kontrolü en fazla 3 kez tekrarlanmalıdır."


def test_normalize_text_handles_turkish_characters() -> None:
    text = "İŞLEM IŞIĞI KONTROL EDİLMELİDİR."

    result = normalize_text(text)

    assert result == "işlem ışığı kontrol edilmelidir."


def test_normalize_text_preserves_numbers_and_percentages() -> None:
    text = "İŞLEM %80 BAŞARI ORANIYLA 15 DAKİKA İÇİNDE TAMAMLANMALIDIR."

    result = normalize_text(text)

    assert result == (
        "işlem %80 başarı oranıyla 15 dakika içinde tamamlanmalıdır."
    )


def test_preprocess_text_returns_both_versions() -> None:
    text = "  Port kontrolü   EN FAZLA 3 kez\ntekrarlanmalıdır.  "

    result = preprocess_text(text)

    assert result == {
        "original_text": "Port kontrolü EN FAZLA 3 kez tekrarlanmalıdır.",
        "normalized_text": "port kontrolü en fazla 3 kez tekrarlanmalıdır.",
    }


def test_none_value_returns_empty_text() -> None:
    result = preprocess_text(None)

    assert result == {
        "original_text": "",
        "normalized_text": "",
    }

def create_valid_requirements_dataframe() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "requirement_id": ["REQ-001", "REQ-002"],
            "requirement_text": [
                "Port kontrolü yapılmalıdır.",
                "Müşteriye SMS gönderilmelidir.",
            ],
            "module": ["Resource", "Notification"],
            "version": ["1.0", "1.0"],
        }
    )


def test_valid_requirements_dataframe_passes_validation() -> None:
    dataframe = create_valid_requirements_dataframe()

    validate_requirements_dataframe(dataframe)


def test_missing_required_column_raises_error() -> None:
    dataframe = create_valid_requirements_dataframe().drop(columns=["module"])

    with pytest.raises(DataValidationError) as exception:
        validate_requirements_dataframe(dataframe)

    assert "Eksik zorunlu sütunlar: module" in str(exception.value)


def test_blank_requirement_text_raises_error() -> None:
    dataframe = create_valid_requirements_dataframe()
    dataframe.loc[1, "requirement_text"] = "   "

    with pytest.raises(DataValidationError) as exception:
        validate_requirements_dataframe(dataframe)

    assert "1 satırda requirement_text boş." in str(exception.value)


def test_duplicate_requirement_id_raises_error() -> None:
    dataframe = create_valid_requirements_dataframe()
    dataframe.loc[1, "requirement_id"] = "REQ-001"

    with pytest.raises(DataValidationError) as exception:
        validate_requirements_dataframe(dataframe)

    assert "REQ-001" in str(exception.value)


def test_empty_dataframe_raises_error() -> None:
    dataframe = create_valid_requirements_dataframe().iloc[0:0]

    with pytest.raises(DataValidationError) as exception:
        validate_requirements_dataframe(dataframe)

    assert "Dosya en az bir gereksinim içermelidir." in str(exception.value)

def test_standardize_column_name() -> None:
    assert standardize_column_name("Requirement ID") == "requirement_id"
    assert standardize_column_name("Requirement-Text") == "requirement_text"
    assert standardize_column_name(" Module ") == "module"


def test_load_requirements_excel_returns_processed_dataframe(
    tmp_path,
) -> None:
    dataframe = pd.DataFrame(
        {
            "Requirement ID": ["REQ-001"],
            "Requirement Text": [
                "  Port kontrolü   EN FAZLA 3 kez yapılmalıdır. "
            ],
            "Module": ["Resource"],
            "Version": ["1.0"],
        }
    )

    file_path = tmp_path / "requirements.xlsx"
    dataframe.to_excel(file_path, index=False)

    result = load_requirements_excel(file_path)

    assert result.loc[0, "requirement_id"] == "REQ-001"
    assert result.loc[0, "original_text"] == (
        "Port kontrolü EN FAZLA 3 kez yapılmalıdır."
    )
    assert result.loc[0, "normalized_text"] == (
        "port kontrolü en fazla 3 kez yapılmalıdır."
    )


def test_load_requirements_excel_missing_file_raises_error(
    tmp_path,
) -> None:
    file_path = tmp_path / "missing.xlsx"

    with pytest.raises(FileLoadingError) as exception:
        load_requirements_excel(file_path)

    assert "Dosya bulunamadı" in str(exception.value)


def test_load_requirements_excel_rejects_unsupported_extension(
    tmp_path,
) -> None:
    file_path = tmp_path / "requirements.csv"
    file_path.write_text("test", encoding="utf-8")

    with pytest.raises(FileLoadingError) as exception:
        load_requirements_excel(file_path)

    assert "Yalnızca .xlsx" in str(exception.value)


def test_load_requirements_excel_validates_required_columns(
    tmp_path,
) -> None:
    dataframe = pd.DataFrame(
        {
            "Requirement ID": ["REQ-001"],
            "Requirement Text": ["Port kontrolü yapılmalıdır."],
        }
    )

    file_path = tmp_path / "requirements.xlsx"
    dataframe.to_excel(file_path, index=False)

    with pytest.raises(DataValidationError) as exception:
        load_requirements_excel(file_path)

    assert "Eksik zorunlu sütunlar" in str(exception.value)