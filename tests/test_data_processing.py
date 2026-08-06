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