import numpy as np
import pandas as pd
import pytest

from backend.app.matching.semantic_matcher import (
    SemanticMatcherNotFittedError,
    SemanticRequirementMatcher,
)


class FakeSentenceTransformer:

    def encode(
        self,
        sentences: list[str],
        **kwargs,
    ) -> np.ndarray:
        vectors: list[list[float]] = []

        for sentence in sentences:
            text = str(sentence).lower()

            if "port" in text:
                vector = [1.0, 0.0, 0.0]

            elif (
                "sms" in text
                or "mesaj" in text
                or "aktivasyon" in text
                or "aktif" in text
            ):
                vector = [0.0, 1.0, 0.0]

            elif (
                "fatura" in text
                or "ödeme" in text
            ):
                vector = [0.0, 0.0, 1.0]

            else:
                vector = [0.2, 0.2, 0.2]

            vectors.append(vector)

        matrix = np.asarray(
            vectors,
            dtype=np.float32,
        )

        if kwargs.get("normalize_embeddings"):
            norms = np.linalg.norm(
                matrix,
                axis=1,
                keepdims=True,
            )

            safe_norms = np.where(
                norms == 0,
                1.0,
                norms,
            )

            matrix = matrix / safe_norms

        return matrix


def create_candidate_dataframe() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "requirement_id": [
                "REQ-101",
                "REQ-102",
                "REQ-103",
            ],
            "requirement_text": [
                "Port kontrolü en fazla 3 kez yapılmalıdır.",
                (
                    "Aktivasyon tamamlandığında müşteriye "
                    "SMS gönderilmelidir."
                ),
                (
                    "Fatura için son ödeme tarihi "
                    "oluşturulmalıdır."
                ),
            ],
        }
    )


def create_matcher() -> SemanticRequirementMatcher:
    return SemanticRequirementMatcher(
        model=FakeSentenceTransformer()
    )


def test_semantic_paraphrase_is_ranked_first() -> None:
    matcher = create_matcher().fit(
        create_candidate_dataframe()
    )

    matches = matcher.find_matches(
        (
            "Hizmet aktif hâle geldikten sonra kullanıcı "
            "kısa mesajla bilgilendirilmelidir."
        ),
        top_k=3,
    )

    assert matches[0].candidate_requirement_id == "REQ-102"
    assert matches[0].rank == 1


def test_semantic_scores_are_between_zero_and_one() -> None:
    matcher = create_matcher().fit(
        create_candidate_dataframe()
    )

    matches = matcher.find_matches(
        "Port uygunluğu kontrol edilmelidir.",
        top_k=3,
    )

    assert all(
        0.0 <= match.similarity_score <= 1.0
        for match in matches
    )


def test_semantic_matcher_respects_top_k() -> None:
    matcher = create_matcher().fit(
        create_candidate_dataframe()
    )

    matches = matcher.find_matches(
        "Müşteriye aktivasyon mesajı gönderilmelidir.",
        top_k=2,
    )

    assert len(matches) == 2
    assert [match.rank for match in matches] == [1, 2]


def test_semantic_matcher_before_fit_raises_error() -> None:
    matcher = create_matcher()

    with pytest.raises(
        SemanticMatcherNotFittedError
    ) as exception:
        matcher.find_matches(
            "Port kontrolü yapılmalıdır."
        )

    assert "fit edilmelidir" in str(exception.value)


def test_semantic_matcher_empty_query_returns_empty_list() -> None:
    matcher = create_matcher().fit(
        create_candidate_dataframe()
    )

    matches = matcher.find_matches("   ")

    assert matches == []


def test_semantic_match_dataframe_returns_ranked_results() -> None:
    source_dataframe = pd.DataFrame(
        {
            "requirement_id": [
                "REQ-001",
                "REQ-002",
            ],
            "requirement_text": [
                "Port uygunluğu kontrol edilmelidir.",
                (
                    "Hizmet aktif olduğunda kullanıcıya "
                    "mesaj gönderilmelidir."
                ),
            ],
        }
    )

    matcher = create_matcher().fit(
        create_candidate_dataframe()
    )

    result = matcher.match_dataframe(
        source_dataframe,
        top_k=2,
    )

    assert len(result) == 4

    port_results = result[
        result["source_requirement_id"] == "REQ-001"
    ]

    message_results = result[
        result["source_requirement_id"] == "REQ-002"
    ]

    assert (
        port_results.iloc[0]["candidate_requirement_id"]
        == "REQ-101"
    )

    assert (
        message_results.iloc[0]["candidate_requirement_id"]
        == "REQ-102"
    )

    assert result["matching_method"].eq(
        "semantic"
    ).all()