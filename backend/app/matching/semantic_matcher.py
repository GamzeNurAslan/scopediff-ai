from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.app.text_preprocessor import normalize_text


DEFAULT_MODEL_NAME = (
    "sentence-transformers/"
    "paraphrase-multilingual-MiniLM-L12-v2"
)


@dataclass(frozen=True)
class SemanticRequirementMatch:
    """Bir anlamsal gereksinim eşleştirme sonucunu temsil eder."""

    candidate_requirement_id: str
    candidate_text: str
    similarity_score: float
    rank: int

    def to_dict(self) -> dict[str, object]:
        """Eşleştirme sonucunu sözlüğe dönüştürür."""
        return asdict(self)


class SemanticMatcherNotFittedError(RuntimeError):
    """Eşleştirici fit edilmeden kullanıldığında oluşan hata."""


class SemanticRequirementMatcher:
    """
    Sentence Transformer embedding'leriyle gereksinimleri eşleştirir.

    Yeni dokümandaki gereksinimler aday kümesi olarak hazırlanır.
    Eski dokümandaki gereksinimler bu adaylar içinde aranır.
    """

    REQUIRED_COLUMNS = {
        "requirement_id",
        "requirement_text",
    }

    def __init__(
        self,
        model_name: str = DEFAULT_MODEL_NAME,
        model: Any | None = None,
        batch_size: int = 32,
        device: str | None = None,
    ) -> None:
        if batch_size <= 0:
            raise ValueError(
                "batch_size değeri sıfırdan büyük olmalıdır."
            )

        self.model_name = model_name
        self.batch_size = batch_size
        self.device = device

        # Testlerde sahte model verebilmek için bağımlılık enjeksiyonu.
        self._model = model

        self._candidate_dataframe: pd.DataFrame | None = None
        self._candidate_embeddings: np.ndarray | None = None
        self._fallback_vectorizer: TfidfVectorizer | None = None
        self._using_fallback = False

    @property
    def is_fitted(self) -> bool:
        """Eşleştiricinin aday gereksinimlerle hazırlanma durumunu döndürür."""
        return (
            self._candidate_dataframe is not None
            and self._candidate_embeddings is not None
        )

    def _get_model(self) -> Any:
        """
        Modeli gerektiği anda yükler.

        Böylece sınıf oluşturulduğunda model hemen indirilmez.
        """
        if self._model is None:
            self._model = SentenceTransformer(
                self.model_name,
                device=self.device,
                local_files_only=True,
            )

        return self._model

    @staticmethod
    def _validate_dataframe(dataframe: pd.DataFrame) -> None:
        """Eşleştirme tablosunun temel yapısını doğrular."""
        if not isinstance(dataframe, pd.DataFrame):
            raise TypeError(
                "Gereksinim verisi pandas DataFrame olmalıdır."
            )

        if dataframe.empty:
            raise ValueError(
                "Gereksinim tablosu boş olamaz."
            )

        missing_columns = (
            SemanticRequirementMatcher.REQUIRED_COLUMNS
            - set(dataframe.columns)
        )

        if missing_columns:
            missing = ", ".join(sorted(missing_columns))

            raise ValueError(
                f"Eksik eşleştirme sütunları: {missing}"
            )

    @staticmethod
    def _prepare_matching_texts(
        dataframe: pd.DataFrame,
    ) -> pd.Series:
        """
        Eşleştirmede kullanılacak metinleri hazırlar.

        normalized_text mevcut ve doluysa onu kullanır.
        Aksi durumda requirement_text değerini normalize eder.
        """
        selected_texts = dataframe["requirement_text"].copy()

        if "normalized_text" in dataframe.columns:
            normalized_values = dataframe["normalized_text"]

            valid_normalized_mask = (
                normalized_values.notna()
                & normalized_values.astype(str).str.strip().ne("")
            )

            selected_texts = selected_texts.where(
                ~valid_normalized_mask,
                normalized_values,
            )

        return selected_texts.apply(normalize_text)

    def _encode(self, texts: list[str]) -> np.ndarray:
        """Metinleri yoğun anlamsal vektörlere dönüştürür."""
        model = self._get_model()

        embeddings = model.encode(
            texts,
            batch_size=self.batch_size,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )

        embedding_array = np.asarray(
            embeddings,
            dtype=np.float32,
        )

        if embedding_array.ndim != 2:
            raise ValueError(
                "Model iki boyutlu bir embedding matrisi döndürmelidir."
            )

        if embedding_array.shape[0] != len(texts):
            raise ValueError(
                "Embedding sayısı ile metin sayısı eşleşmiyor."
            )

        return embedding_array

    def _encode(
        self,
        texts: list[str],
    ) -> np.ndarray:
        """Model erişilemezse yerel TF-IDF ile eşleştirme yapar."""
        if self._using_fallback:
            if self._fallback_vectorizer is None:
                raise RuntimeError(
                    "Offline eşleştirme vektörleştiricisi hazır değil."
                )

            return self._fallback_vectorizer.transform(
                texts
            ).toarray().astype(np.float32)

        try:
            model = self._get_model()
            embeddings = model.encode(
                texts,
                batch_size=self.batch_size,
                show_progress_bar=False,
                convert_to_numpy=True,
                normalize_embeddings=True,
            )

            embedding_array = np.asarray(
                embeddings,
                dtype=np.float32,
            )

            if embedding_array.ndim != 2:
                raise ValueError(
                    "Model embedding matrisi iki boyutlu olmalıdır."
                )

            if embedding_array.shape[0] != len(texts):
                raise ValueError(
                    "Embedding sayısı ile metin sayısı eşleşmiyor."
                )

            return embedding_array
        except Exception:
            self._using_fallback = True
            self._fallback_vectorizer = TfidfVectorizer(
                ngram_range=(1, 2),
                lowercase=True,
            )
            self._fallback_vectorizer.fit(texts)

            return self._fallback_vectorizer.transform(
                texts
            ).toarray().astype(np.float32)

    def fit(
        self,
        candidate_dataframe: pd.DataFrame,
    ) -> SemanticRequirementMatcher:
        """
        Yeni dokümandaki aday gereksinimlerin embedding'lerini üretir.
        """
        self._validate_dataframe(candidate_dataframe)

        prepared_dataframe = (
            candidate_dataframe.copy()
            .reset_index(drop=True)
        )

        prepared_dataframe["_matching_text"] = (
            self._prepare_matching_texts(prepared_dataframe)
        )

        empty_text_mask = (
            prepared_dataframe["_matching_text"]
            .astype(str)
            .str.strip()
            .eq("")
        )

        if empty_text_mask.any():
            empty_count = int(empty_text_mask.sum())

            raise ValueError(
                f"{empty_count} aday gereksinimde boş metin bulundu."
            )

        candidate_texts = (
            prepared_dataframe["_matching_text"]
            .astype(str)
            .tolist()
        )

        candidate_embeddings = self._encode(candidate_texts)

        self._candidate_dataframe = prepared_dataframe
        self._candidate_embeddings = candidate_embeddings

        return self

    def find_matches(
        self,
        query_text: object,
        top_k: int = 5,
        min_score: float = 0.0,
    ) -> list[SemanticRequirementMatch]:
        """
        Bir gereksinim için en benzer anlamsal adayları döndürür.
        """
        if not self.is_fitted:
            raise SemanticMatcherNotFittedError(
                "Anlamsal eşleştirici kullanılmadan önce "
                "fit edilmelidir."
            )

        if top_k <= 0:
            raise ValueError(
                "top_k değeri sıfırdan büyük olmalıdır."
            )

        if not 0.0 <= min_score <= 1.0:
            raise ValueError(
                "min_score değeri 0 ile 1 arasında olmalıdır."
            )

        normalized_query = normalize_text(query_text)

        if not normalized_query:
            return []

        query_embedding = self._encode([normalized_query])

        raw_scores = cosine_similarity(
            query_embedding,
            self._candidate_embeddings,
        ).flatten()

        sorted_indexes = np.argsort(raw_scores)[::-1]

        matches: list[SemanticRequirementMatch] = []

        for candidate_index in sorted_indexes:
            # Kosinüs benzerliği teorik olarak negatif olabilir.
            # ScopeDiff çıktısında skorları 0-1 aralığında tutuyoruz.
            score = float(
                np.clip(
                    raw_scores[candidate_index],
                    0.0,
                    1.0,
                )
            )

            if score < min_score:
                continue

            candidate_row = self._candidate_dataframe.iloc[
                int(candidate_index)
            ]

            matches.append(
                SemanticRequirementMatch(
                    candidate_requirement_id=str(
                        candidate_row["requirement_id"]
                    ).strip(),
                    candidate_text=str(
                        candidate_row["requirement_text"]
                    ),
                    similarity_score=score,
                    rank=len(matches) + 1,
                )
            )

            if len(matches) >= top_k:
                break

        return matches

    def match_dataframe(
        self,
        source_dataframe: pd.DataFrame,
        top_k: int = 5,
        min_score: float = 0.0,
    ) -> pd.DataFrame:
        """
        Eski dokümandaki tüm gereksinimleri anlamsal olarak eşleştirir.
        """
        self._validate_dataframe(source_dataframe)

        source_texts = self._prepare_matching_texts(
            source_dataframe
        )

        result_rows: list[dict[str, object]] = []

        for row_position, (_, source_row) in enumerate(
            source_dataframe.iterrows()
        ):
            matches = self.find_matches(
                query_text=source_texts.iloc[row_position],
                top_k=top_k,
                min_score=min_score,
            )

            for match in matches:
                result_rows.append(
                    {
                        "source_requirement_id": str(
                            source_row["requirement_id"]
                        ).strip(),
                        "source_text": str(
                            source_row["requirement_text"]
                        ),
                        "candidate_requirement_id": (
                            match.candidate_requirement_id
                        ),
                        "candidate_text": match.candidate_text,
                        "similarity_score": (
                            match.similarity_score
                        ),
                        "rank": match.rank,
                        "matching_method": "semantic",
                        "model_name": self.model_name,
                    }
                )

        return pd.DataFrame(
            result_rows,
            columns=[
                "source_requirement_id",
                "source_text",
                "candidate_requirement_id",
                "candidate_text",
                "similarity_score",
                "rank",
                "matching_method",
                "model_name",
            ],
        )
