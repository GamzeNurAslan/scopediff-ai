import math
import re
import unicodedata


def _is_missing(value: object) -> bool:
    """Değerin None veya NaN olup olmadığını kontrol eder."""
    if value is None:
        return True

    if isinstance(value, float) and math.isnan(value):
        return True

    return False


def clean_original_text(value: object) -> str:
    """
    Metnin okunabilir hâlini hazırlar.

    - None ve NaN değerlerini boş metne çevirir.
    - Unicode karakterlerini standartlaştırır.
    - Satır sonlarını ve fazla boşlukları temizler.
    - Büyük ve küçük harfleri değiştirmez.
    """
    if _is_missing(value):
        return ""

    text = str(value)

    text = unicodedata.normalize("NFKC", text)

    text = re.sub(r"\s+", " ", text)

    return text.strip()


def normalize_text(value: object) -> str:
    """
    Metni NLP karşılaştırması için normalize eder.

    Türkçe karakterlere uygun küçük harf dönüşümü uygular.
    Sayıları, yüzdeleri ve noktalama işaretlerini korur.
    """
    cleaned_text = clean_original_text(value)

    if not cleaned_text:
        return ""

    turkish_translation = str.maketrans(
        {
            "I": "ı",
            "İ": "i",
        }
    )

    normalized_text = cleaned_text.translate(turkish_translation).lower()

    return normalized_text


def preprocess_text(value: object) -> dict[str, str]:
    """
    Metnin hem kullanıcıya gösterilecek hem de analizde kullanılacak
    sürümünü döndürür.
    """
    original_text = clean_original_text(value)
    normalized_text = normalize_text(original_text)

    return {
        "original_text": original_text,
        "normalized_text": normalized_text,
    }