from backend.app.translation.content_translator import (
    translate_content,
)


text = (
    "Aktivasyon işlemi makul süre "
    "içinde tamamlanmalıdır."
)

translated = translate_content(
    text,
    "en",
)

print()
print("TURKISH:")
print(text)

print()
print("ENGLISH:")
print(translated)

print()