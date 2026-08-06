from __future__ import annotations

from dataclasses import asdict, dataclass

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.app.text_preprocessor import normalize_text


@dataclass(frozen=True)
class RequirementMatch:
    """Bir gereksinim eşleştirme sonucunu temsil eder."""

    candidate_requirement_id: str
    candidate_text: str
    similarity_score: float
    rank: int

    def to_dict(self) -> dict:
        """Eşleştirme sonucunu sözlüğe dönüştürür."""
        return asdict(self)


class MatcherNotFittedError(RuntimeError):
    """Eşleştirici eğitilmeden kullanıldığında oluşan hata."""


class TfidfRequirementMatcher:
    """
    TF-IDF ve kosinüs benzerliği kullanarak gereksinimleri eşleştirir.

    Yeni dokümandaki gereksinimler aday kümesi olarak fit edilir.
    Eski dokümandaki gereksinimler bu adaylar üzerinde sorgulanır.
    """

    REQUIRED_COLUMNS = {
        "requirement_id",
        "requirement_text",
    }

    def __init__(
        self,
        ngram_range: tuple[int, int] = (1, 2),
    ) -> None:
        self.vectorizer = TfidfVectorizer(
            analyzer="word",
            ngram_range=ngram_range,
            lowercase=False,
            sublinear_tf=True,
            norm="l2",
        )

        self._candidate_dataframe: pd.DataFrame | None = None
        self._candidate_matrix = None

    @property
    def is_fitted(self) -> bool:
        """Eşleştiricinin aday gereksinimlerle hazırlanıp hazırlanmadığını döndürür."""
        return (
            self._candidate_dataframe is not None
            and self._candidate_matrix is not None
        )

    @staticmethod
    def _validate_dataframe(dataframe: pd.DataFrame) -> None:
        """Eşleştirme tablosunun gerekli sütunlarını kontrol eder."""
        if not isinstance(dataframe, pd.DataFrame):
            raise TypeError("Gereksinim verisi pandas DataFrame olmalıdır.")

        if dataframe.empty:
            raise ValueError("Gereksinim tablosu boş olamaz.")

        missing_columns = (
            TfidfRequirementMatcher.REQUIRED_COLUMNS
            - set(dataframe.columns)
        )

        if missing_columns:
            missing = ", ".join(sorted(missing_columns))
            raise ValueError(f"Eksik eşleştirme sütunları: {missing}")

    @staticmethod
    def _prepare_matching_texts(
        dataframe: pd.DataFrame,
    ) -> pd.Series:
        """
        Eşleştirmede kullanılacak metinleri hazırlar.

        normalized_text varsa onu, boşsa requirement_text değerini kullanır.
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

    def fit(
        self,
        candidate_dataframe: pd.DataFrame,
    ) -> TfidfRequirementMatcher:
        """
        Yeni dokümandaki aday gereksinimleri TF-IDF uzayına dönüştürür.
        """
        self._validate_dataframe(candidate_dataframe)

        prepared_dataframe = candidate_dataframe.copy().reset_index(
            drop=True
        )

        prepared_dataframe["_matching_text"] = (
            self._prepare_matching_texts(prepared_dataframe)
        )

        if prepared_dataframe["_matching_text"].str.strip().eq("").all():
            raise ValueError(
                "Aday gereksinimlerin tamamı boş metin içeriyor."
            )

        try:
            candidate_matrix = self.vectorizer.fit_transform(
                prepared_dataframe["_matching_text"]
            )
        except ValueError as error:
            raise ValueError(
                f"TF-IDF aday metinleri hazırlanamadı: {error}"
            ) from error

        self._candidate_dataframe = prepared_dataframe
        self._candidate_matrix = candidate_matrix

        return self

    def find_matches(
        self,
        query_text: object,
        top_k: int = 5,
        min_score: float = 0.0,
    ) -> list[RequirementMatch]:
        """
        Bir gereksinim metni için en benzer aday gereksinimleri döndürür.
        """
        if not self.is_fitted:
            raise MatcherNotFittedError(
                "Eşleştirici kullanılmadan önce fit edilmelidir."
            )

        if top_k <= 0:
            raise ValueError("top_k değeri sıfırdan büyük olmalıdır.")

        if not 0.0 <= min_score <= 1.0:
            raise ValueError(
                "min_score değeri 0 ile 1 arasında olmalıdır."
            )

        normalized_query = normalize_text(query_text)

        if not normalized_query:
            return []

        query_matrix = self.vectorizer.transform([normalized_query])

        similarity_scores = cosine_similarity(
            query_matrix,
            self._candidate_matrix,
        ).flatten()

        sorted_indexes = sorted(
            range(len(similarity_scores)),
            key=lambda index: similarity_scores[index],
            reverse=True,
        )

        matches: list[RequirementMatch] = []

        for candidate_index in sorted_indexes:
            score = float(similarity_scores[candidate_index])

            if score < min_score:
                continue

            candidate_row = self._candidate_dataframe.iloc[
                candidate_index
            ]

            matches.append(
                RequirementMatch(
                    candidate_requirement_id=str(
                        candidate_row["requirement_id"]
                    ),
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
        Eski dokümandaki tüm gereksinimleri aday gereksinimlerle eşleştirir.
        """
        self._validate_dataframe(source_dataframe)

        source_texts = self._prepare_matching_texts(source_dataframe)

        result_rows: list[dict] = []

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
                        ),
                        "source_text": str(
                            source_row["requirement_text"]
                        ),
                        "candidate_requirement_id": (
                            match.candidate_requirement_id
                        ),
                        "candidate_text": match.candidate_text,
                        "similarity_score": match.similarity_score,
                        "rank": match.rank,
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
            ],
        )