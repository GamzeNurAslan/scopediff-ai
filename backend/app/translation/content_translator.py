from __future__ import annotations

from functools import lru_cache

import torch
from transformers import (
    AutoModelForSeq2SeqLM,
    AutoTokenizer,
)


SUPPORTED_LANGUAGES = {
    "tr",
    "en",
    "de",
    "fr",
    "es",
}


DIRECT_MODELS = {
    "en": "Helsinki-NLP/opus-mt-tr-en",
    "fr": "Helsinki-NLP/opus-mt-tr-fr",
    "es": "Helsinki-NLP/opus-mt-tr-es",
}


GERMAN_FIRST_MODEL = (
    "Helsinki-NLP/opus-mt-tr-en"
)

GERMAN_SECOND_MODEL = (
    "Helsinki-NLP/opus-mt-en-de"
)


@lru_cache(maxsize=5)
def _load_model(
    model_name: str,
):
    tokenizer = (
        AutoTokenizer
        .from_pretrained(
            model_name,
        )
    )

    model = (
        AutoModelForSeq2SeqLM
        .from_pretrained(
            model_name,
        )
    )

    device = torch.device(
        "cuda"
        if torch.cuda.is_available()
        else "cpu"
    )

    model.to(
        device,
    )

    model.eval()

    return (
        tokenizer,
        model,
        device,
    )


def _translate_with_model(
    texts: list[str],
    model_name: str,
) -> list[str]:
    if not texts:
        return []

    tokenizer, model, device = (
        _load_model(
            model_name,
        )
    )

    encoded = tokenizer(
        texts,
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=512,
    )

    encoded = {
        key: value.to(
            device,
        )
        for key, value
        in encoded.items()
    }

    with torch.inference_mode():
        generated = model.generate(
            **encoded,
            max_new_tokens=256,
            num_beams=4,
        )

    translated = (
        tokenizer.batch_decode(
            generated,
            skip_special_tokens=True,
        )
    )

    return [
        value.strip()
        for value
        in translated
    ]


def translate_content_batch(
    texts: list[str],
    target_language: str,
) -> list[str]:
    """
    ScopeDiff dinamik içerik çevirisi.

    Kaynak içerik şu an Türkçe kabul edilir.

    Desteklenen hedefler:
    tr, en, de, fr, es

    UI çevirisi için kullanılmaz.
    Requirement, açıklama, süreç metni gibi
    dinamik içerikler için kullanılır.
    """

    language = (
        target_language
        .strip()
        .lower()
    )

    if (
        language
        not in SUPPORTED_LANGUAGES
    ):
        raise ValueError(
            "Desteklenmeyen hedef dil: "
            f"{target_language}"
        )

    if not texts:
        return []

    normalized_texts = [
        text.strip()
        if text
        else ""
        for text
        in texts
    ]

    if language == "tr":
        return normalized_texts

    result = [
        ""
        for _ in normalized_texts
    ]

    non_empty_indexes = [
        index
        for index, text
        in enumerate(
            normalized_texts,
        )
        if text
    ]

    if not non_empty_indexes:
        return result

    non_empty_texts = [
        normalized_texts[index]
        for index
        in non_empty_indexes
    ]

    if language in DIRECT_MODELS:
        translated = (
            _translate_with_model(
                non_empty_texts,
                DIRECT_MODELS[
                    language
                ],
            )
        )

    elif language == "de":
        english = (
            _translate_with_model(
                non_empty_texts,
                GERMAN_FIRST_MODEL,
            )
        )

        translated = (
            _translate_with_model(
                english,
                GERMAN_SECOND_MODEL,
            )
        )

    else:
        translated = (
            non_empty_texts
        )

    for index, value in zip(
        non_empty_indexes,
        translated,
    ):
        result[index] = value

    return result


def translate_content(
    text: str,
    target_language: str,
) -> str:
    if not text:
        return text

    translated = (
        translate_content_batch(
            [text],
            target_language,
        )
    )

    if not translated:
        return text

    return translated[0]