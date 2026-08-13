from __future__ import annotations

import re
from dataclasses import asdict, dataclass
from typing import Any

import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.app.matching.semantic_matcher import DEFAULT_MODEL_NAME
from backend.app.text_preprocessor import normalize_text


@dataclass(frozen=True)
class DefectChangeCandidate:
    """Bir defect için incelenmesi gereken aday değişikliği temsil eder."""
    change_id: str | None
    old_requirement_id: str | None
    new_requirement_id: str | None
    change_type: str
    semantic_similarity: float
    risk_score: int
    keyword_overlap: float
    relevance_score: float
    rank: int
    reason: str

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


class DefectChangeRanker:
    """
    Defect metni ile gereksinim değişiklikleri arasındaki ilişkiyi sıralar.

    Relevance score üç sinyalden oluşur:

    - semantic similarity
    - requirement change risk
    - keyword/context overlap

    Sonuçlar kök neden olarak değil,
    incelenmesi gereken aday değişiklikler olarak yorumlanmalıdır.
    """

    REQUIRED_COLUMNS = {
        "old_requirement_id",
        "new_requirement_id",
        "old_text",
        "new_text",
        "change_type",
        "risk_score",
    }

    STOP_WORDS = {
        "ve",
        "veya",
        "ile",
        "icin",
        "için",
        "bir",
        "bu",
        "şu",
        "olarak",
        "sonra",
        "önce",
        "de",
        "da",
        "ise",
        "mi",
        "mı",
        "mu",
        "mü",
    }

    TOKEN_PATTERN = re.compile(
        r"[a-zA-ZçğıöşüÇĞİÖŞÜ0-9]+"
    )

    def __init__(
        self,
        model_name: str = DEFAULT_MODEL_NAME,
        model: Any | None = None,
        semantic_weight: float = 0.65,
        risk_weight: float = 0.20,
        keyword_weight: float = 0.15,
        batch_size: int = 32,
        device: str | None = None,
    ) -> None:
        total_weight = (
            semantic_weight
            + risk_weight
            + keyword_weight
        )

        if not np.isclose(total_weight, 1.0):
            raise ValueError(
                "Ranking ağırlıklarının toplamı 1.0 olmalıdır."
            )

        if any(
            weight < 0.0
            for weight in (
                semantic_weight,
                risk_weight,
                keyword_weight,
            )
        ):
            raise ValueError(
                "Ranking ağırlıkları negatif olamaz."
            )

        if batch_size <= 0:
            raise ValueError(
                "batch_size sıfırdan büyük olmalıdır."
            )

        self.model_name = model_name
        self.semantic_weight = semantic_weight
        self.risk_weight = risk_weight
        self.keyword_weight = keyword_weight
        self.batch_size = batch_size
        self.device = device

        self._model = model
        self._fallback_vectorizer: TfidfVectorizer | None = None
        self._using_fallback = False

    def _get_model(self) -> Any:
        """Sentence Transformer modelini ihtiyaç olduğunda yükler."""
        if self._model is None:
            self._model = SentenceTransformer(
                self.model_name,
                device=self.device,
                local_files_only=True,
            )

        return self._model

    def _encode_with_model(
        self,
        texts: list[str],
    ) -> np.ndarray:
        """Metinleri anlamsal embedding'lere dönüştürür."""
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
                "Model iki boyutlu embedding matrisi döndürmelidir."
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
        """Model erişilemezse yerel TF-IDF ile defect eşleştirir."""
        if self._using_fallback:
            if self._fallback_vectorizer is None:
                raise RuntimeError(
                    "Offline defect vektörleştiricisi hazır değil."
                )

            return self._fallback_vectorizer.transform(
                texts
            ).toarray().astype(np.float32)

        try:
            return self._encode_with_model(texts)
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

    @classmethod
    def _validate_changes_dataframe(
        cls,
        dataframe: pd.DataFrame,
    ) -> None:
        """Pipeline çıktısının gerekli sütunlarını doğrular."""
        if not isinstance(dataframe, pd.DataFrame):
            raise TypeError(
                "Değişiklik verisi pandas DataFrame olmalıdır."
            )

        if dataframe.empty:
            raise ValueError(
                "Değişiklik tablosu boş olamaz."
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
                f"Eksik değişiklik sütunları: {missing}"
            )

    @staticmethod
    def _safe_text(
        value: object,
    ) -> str:
        """NaN ve None değerlerini güvenli metne dönüştürür."""
        if value is None:
            return ""

        try:
            if pd.isna(value):
                return ""
        except (TypeError, ValueError):
            pass

        return normalize_text(value)

    @classmethod
    def _build_candidate_text(
        cls,
        row: pd.Series,
    ) -> str:
        """
        Semantic karşılaştırma için eski ve yeni gereksinimi
        tek aday bağlamında birleştirir.
        """
        old_text = cls._safe_text(
            row["old_text"]
        )

        new_text = cls._safe_text(
            row["new_text"]
        )

        if old_text and new_text:
            return (
                f"önce: {old_text} "
                f"sonra: {new_text}"
            )

        if new_text:
            return new_text

        return old_text

    @classmethod
    def _extract_keywords(
        cls,
        text: object,
    ) -> set[str]:
        """Basit bağlam karşılaştırması için anlamlı tokenları çıkarır."""
        normalized = normalize_text(text)

        tokens = {
            token.lower()
            for token in cls.TOKEN_PATTERN.findall(
                normalized
            )
        }

        return {
            token
            for token in tokens
            if (
                len(token) >= 2
                and token not in cls.STOP_WORDS
            )
        }

    @classmethod
    def _calculate_keyword_overlap(
        cls,
        defect_text: str,
        candidate_text: str,
    ) -> tuple[float, list[str]]:
        """
        Defect anahtar kelimelerinin ne kadarının değişiklik
        metninde bulunduğunu hesaplar.
        """
        defect_keywords = cls._extract_keywords(
            defect_text
        )

        candidate_keywords = cls._extract_keywords(
            candidate_text
        )

        if not defect_keywords:
            return 0.0, []

        common_keywords = sorted(
            defect_keywords
            & candidate_keywords
        )

        overlap = (
            len(common_keywords)
            / len(defect_keywords)
        )

        return float(overlap), common_keywords

    @staticmethod
    def _semantic_description(
        semantic_similarity: float,
    ) -> str:
        if semantic_similarity >= 0.75:
            return "yüksek"

        if semantic_similarity >= 0.50:
            return "orta"

        return "düşük"

    @classmethod
    def _create_reason(
        cls,
        semantic_similarity: float,
        risk_score: int,
        common_keywords: list[str],
    ) -> str:
        """Kullanıcıya gösterilecek açıklanabilir ranking gerekçesini üretir."""
        semantic_level = cls._semantic_description(
            semantic_similarity
        )

        parts = [
            (
                "Defect metni ile değişiklik arasında "
                f"{semantic_level} anlamsal benzerlik bulundu."
            ),
            (
                f"Değişikliğin mevcut risk skoru "
                f"{risk_score}/100."
            ),
        ]

        if common_keywords:
            keywords = ", ".join(
                common_keywords[:5]
            )

            parts.append(
                f"Ortak bağlam terimleri: {keywords}."
            )

        parts.append(
            (
                "Bu sonuç kesin kök neden değildir; "
                "incelenmesi gereken aday değişikliklerden biridir."
            )
        )

        return " ".join(parts)

    def rank(
        self,
        defect_text: object,
        changes_dataframe: pd.DataFrame,
        top_k: int = 5,
        min_relevance: float = 0.0,
    ) -> pd.DataFrame:
        """
        Bir defect için en ilgili gereksinim değişikliklerini sıralar.
        """
        self._validate_changes_dataframe(
            changes_dataframe
        )

        if top_k <= 0:
            raise ValueError(
                "top_k sıfırdan büyük olmalıdır."
            )

        if not 0.0 <= min_relevance <= 1.0:
            raise ValueError(
                "min_relevance 0 ile 1 arasında olmalıdır."
            )

        normalized_defect = normalize_text(
            defect_text
        )

        if not normalized_defect:
            return self._empty_result()

        prepared_data = (
            changes_dataframe
            .copy()
            .reset_index(drop=True)
        )

        candidate_texts = [
            self._build_candidate_text(row)
            for _, row in prepared_data.iterrows()
        ]

        candidate_embeddings = self._encode(
            candidate_texts
        )

        defect_embedding = self._encode(
            [normalized_defect]
        )

        semantic_scores = cosine_similarity(
            defect_embedding,
            candidate_embeddings,
        ).flatten()

        candidates: list[
            DefectChangeCandidate
        ] = []

        for row_index, row in prepared_data.iterrows():
            semantic_similarity = float(
                np.clip(
                    semantic_scores[row_index],
                    0.0,
                    1.0,
                )
            )

            risk_score = int(
                np.clip(
                    float(row["risk_score"]),
                    0.0,
                    100.0,
                )
            )

            candidate_text = candidate_texts[
                row_index
            ]

            (
                keyword_overlap,
                common_keywords,
            ) = self._calculate_keyword_overlap(
                normalized_defect,
                candidate_text,
            )

            risk_component = (
                risk_score / 100.0
            )

            relevance_score = (
                self.semantic_weight
                * semantic_similarity
                + self.risk_weight
                * risk_component
                + self.keyword_weight
                * keyword_overlap
            )

            relevance_score = float(
                np.clip(
                    relevance_score,
                    0.0,
                    1.0,
                )
            )

            if relevance_score < min_relevance:
                continue

            change_id = None

            if "change_id" in row.index:
                change_id = self._safe_optional_id(
                    row["change_id"]
                )

            old_id = self._safe_optional_id(
                row["old_requirement_id"]
            )

            new_id = self._safe_optional_id(
                row["new_requirement_id"]
            )

            candidates.append(
                DefectChangeCandidate(
                    change_id=change_id,
                    old_requirement_id=old_id,
                    new_requirement_id=new_id,
                    change_type=str(
                        row["change_type"]
                    ),
                    semantic_similarity=round(
                        semantic_similarity,
                        4,
                    ),
                    risk_score=risk_score,
                    keyword_overlap=round(
                        keyword_overlap,
                        4,
                    ),
                    relevance_score=round(
                        relevance_score,
                        4,
                    ),
                    rank=0,
                    reason=self._create_reason(
                        semantic_similarity,
                        risk_score,
                        common_keywords,
                    ),
                )
            )

        candidates.sort(
            key=lambda candidate: (
                candidate.relevance_score,
                candidate.semantic_similarity,
                candidate.risk_score,
            ),
            reverse=True,
        )

        ranked_candidates: list[
            DefectChangeCandidate
        ] = []

        for rank, candidate in enumerate(
            candidates[:top_k],
            start=1,
        ):
            ranked_candidates.append(
                DefectChangeCandidate(
                    change_id=candidate.change_id,
                    old_requirement_id=(
                        candidate.old_requirement_id
                    ),
                    new_requirement_id=(
                        candidate.new_requirement_id
                    ),
                    change_type=candidate.change_type,
                    semantic_similarity=(
                        candidate.semantic_similarity
                    ),
                    risk_score=candidate.risk_score,
                    keyword_overlap=(
                        candidate.keyword_overlap
                    ),
                    relevance_score=(
                        candidate.relevance_score
                    ),
                    rank=rank,
                    reason=candidate.reason,
                )
            )

        return pd.DataFrame(
            [
                candidate.to_dict()
                for candidate in ranked_candidates
            ],
            columns=self._result_columns(),
        )

    @staticmethod
    def _safe_optional_id(
        value: object,
    ) -> str | None:
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
    def _result_columns() -> list[str]:
        return [
            "change_id",
            "old_requirement_id",
            "new_requirement_id",
            "change_type",
            "semantic_similarity",
            "risk_score",
            "keyword_overlap",
            "relevance_score",
            "rank",
            "reason",
        ]

    @classmethod
    def _empty_result(
        cls,
    ) -> pd.DataFrame:
        return pd.DataFrame(
            columns=cls._result_columns()
        )
