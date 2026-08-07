import numpy as np
import pandas as pd
import pytest

from backend.app.defects.defect_change_ranker import (
    DefectChangeRanker,
)


class FakeSentenceTransformer:
    """Gerçek modeli indirmeden kontrollü semantic skor üretir."""

    def encode(
        self,
        sentences: list[str],
        **kwargs,
    ) -> np.ndarray:
        vectors: list[list[float]] = []

        for sentence in sentences:
            text = str(sentence).lower()

            if (
                "kimlik" in text
                or "doğrulan" in text
                or "hesap" in text
            ):
                vector = [1.0, 0.0, 0.0]

            elif (
                "port" in text
                or "kaynak" in text
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

        if kwargs.get(
            "normalize_embeddings"
        ):
            norms = np.linalg.norm(
                matrix,
                axis=1,
                keepdims=True,
            )

            norms = np.where(
                norms == 0,
                1.0,
                norms,
            )

            matrix = matrix / norms

        return matrix


def create_changes_dataframe() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "old_requirement_id": [
                "REQ-001",
                "REQ-002",
                "REQ-003",
            ],
            "new_requirement_id": [
                "REQ-001",
                "REQ-002",
                "REQ-003",
            ],
            "old_text": [
                (
                    "Müşteri kimliği doğrulanmadan "
                    "hesap bilgileri gösterilmemelidir."
                ),
                (
                    "Port kontrolü en fazla "
                    "3 kez yapılmalıdır."
                ),
                (
                    "Fatura son ödeme tarihi "
                    "30 gün olmalıdır."
                ),
            ],
            "new_text": [
                (
                    "Müşteri hesap bilgileri "
                    "kimlik kontrolünden önce "
                    "görüntülenebilir."
                ),
                (
                    "Port kontrolü en fazla "
                    "5 kez yapılabilir."
                ),
                (
                    "Fatura son ödeme tarihi "
                    "45 gün olmalıdır."
                ),
            ],
            "change_type": [
                "changed",
                "changed",
                "changed",
            ],
            "risk_score": [
                85,
                65,
                35,
            ],
        }
    )


def create_ranker() -> DefectChangeRanker:
    return DefectChangeRanker(
        model=FakeSentenceTransformer()
    )


def test_related_change_is_ranked_first() -> None:
    ranker = create_ranker()

    result = ranker.rank(
        defect_text=(
            "Kimlik doğrulaması yapılmadan "
            "müşteri hesap bilgileri "
            "görüntülenebiliyor."
        ),
        changes_dataframe=create_changes_dataframe(),
        top_k=3,
    )

    assert (
        result.iloc[0]["old_requirement_id"]
        == "REQ-001"
    )

    assert result.iloc[0]["rank"] == 1


def test_relevance_scores_are_between_zero_and_one() -> None:
    ranker = create_ranker()

    result = ranker.rank(
        defect_text=(
            "Port kontrolü beklenenden "
            "fazla çalışıyor."
        ),
        changes_dataframe=create_changes_dataframe(),
    )

    assert result["relevance_score"].between(
        0.0,
        1.0,
    ).all()


def test_ranker_respects_top_k() -> None:
    ranker = create_ranker()

    result = ranker.rank(
        defect_text=(
            "Port kontrolünde hata oluşuyor."
        ),
        changes_dataframe=create_changes_dataframe(),
        top_k=2,
    )

    assert len(result) == 2

    assert result["rank"].tolist() == [
        1,
        2,
    ]


def test_empty_defect_returns_empty_dataframe() -> None:
    ranker = create_ranker()

    result = ranker.rank(
        defect_text="   ",
        changes_dataframe=create_changes_dataframe(),
    )

    assert result.empty


def test_keyword_overlap_is_calculated() -> None:
    ranker = create_ranker()

    result = ranker.rank(
        defect_text=(
            "Port kontrolü 5 kez "
            "çalıştırılıyor."
        ),
        changes_dataframe=create_changes_dataframe(),
    )

    row = result[
        result["old_requirement_id"]
        == "REQ-002"
    ].iloc[0]

    assert row["keyword_overlap"] > 0.0


def test_higher_risk_increases_relevance_when_semantic_score_is_equal(
) -> None:
    dataframe = pd.DataFrame(
        {
            "old_requirement_id": [
                "REQ-100",
                "REQ-200",
            ],
            "new_requirement_id": [
                "REQ-100",
                "REQ-200",
            ],
            "old_text": [
                "Müşteri kimliği kontrol edilmelidir.",
                "Müşteri kimliği kontrol edilmelidir.",
            ],
            "new_text": [
                "Müşteri kimliği doğrulanmalıdır.",
                "Müşteri kimliği doğrulanmalıdır.",
            ],
            "change_type": [
                "changed",
                "changed",
            ],
            "risk_score": [
                20,
                90,
            ],
        }
    )

    ranker = create_ranker()

    result = ranker.rank(
        defect_text=(
            "Müşteri kimliği doğrulanamıyor."
        ),
        changes_dataframe=dataframe,
        top_k=2,
    )

    assert (
        result.iloc[0]["old_requirement_id"]
        == "REQ-200"
    )


def test_reason_uses_candidate_wording() -> None:
    ranker = create_ranker()

    result = ranker.rank(
        defect_text=(
            "Kimlik doğrulaması yapılmadan "
            "hesap görüntüleniyor."
        ),
        changes_dataframe=create_changes_dataframe(),
        top_k=1,
    )

    reason = result.iloc[0]["reason"]

    assert "kesin kök neden değildir" in reason
    assert "aday değişiklik" in reason


def test_missing_required_column_raises_error() -> None:
    dataframe = (
        create_changes_dataframe()
        .drop(columns=["risk_score"])
    )

    ranker = create_ranker()

    with pytest.raises(ValueError) as exception:
        ranker.rank(
            defect_text="Port hatası oluşuyor.",
            changes_dataframe=dataframe,
        )

    assert "Eksik değişiklik sütunları" in str(
        exception.value
    )