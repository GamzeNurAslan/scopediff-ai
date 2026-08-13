from pathlib import Path

import pandas as pd

from backend.app.comparison.change_analyzer import (
    RequirementChangeAnalyzer,
)
from backend.app.comparison.change_detector import ChangeType
from backend.app.defects.defect_change_ranker import (
    DefectChangeRanker,
)
from backend.app.risk.risk_scorer import (
    RequirementRiskScorer,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]

VERSION_HISTORY_PATH = (
    PROJECT_ROOT
    / "dataset"
    / "requirement_version_history_v1.xlsx"
)

DEFECT_DATASET_PATH = (
    PROJECT_ROOT
    / "dataset"
    / "defect_change_links_v1.xlsx"
)

RESULTS_DIRECTORY = (
    PROJECT_ROOT
    / "experiments"
    / "results"
)


def load_evaluation_data() -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Transition ve defect benchmark verilerini Excel dosyalarından okur.
    """

    transitions = pd.read_excel(
        VERSION_HISTORY_PATH,
        sheet_name="Transitions",
        engine="openpyxl",
    )

    defects = pd.read_excel(
        DEFECT_DATASET_PATH,
        sheet_name="Defect Links",
        engine="openpyxl",
    )

    return transitions, defects


def build_change_candidates(
    transitions: pd.DataFrame,
) -> pd.DataFrame:
    """
    Transition verilerini DefectChangeRanker'ın kullanabileceği
    aday değişiklik tablosuna dönüştürür.
    """

    analyzer = RequirementChangeAnalyzer()
    scorer = RequirementRiskScorer()

    rows: list[dict[str, object]] = []

    for _, transition in transitions.iterrows():
        old_text = transition["old_requirement"]
        new_text = transition["new_requirement"]

        detailed_changes = analyzer.analyze(
            old_text=old_text,
            new_text=new_text,
        )

        risk_assessment = scorer.assess(
            base_change_type=ChangeType.CHANGED,
            similarity_score=1.0,
            detailed_changes=detailed_changes,
            match_strategy="requirement_id",
        )

        requirement_id = str(
            transition["requirement_id"]
        ).strip()

        rows.append(
            {
                "change_id": str(
                    transition["transition_id"]
                ).strip(),
                "old_requirement_id": requirement_id,
                "new_requirement_id": requirement_id,
                "old_text": old_text,
                "new_text": new_text,
                "change_type": str(
                    transition["change_type"]
                ).strip(),
                "risk_score": (
                    risk_assessment.risk_score
                ),
            }
        )

    return pd.DataFrame(rows)


def find_gold_rank(
    ranking: pd.DataFrame,
    expected_transition_id: str,
) -> int | None:
    """
    Gold-standard transition'ın sıralamadaki konumunu bulur.
    """

    ranked_ids = ranking["change_id"].tolist()

    if expected_transition_id not in ranked_ids:
        return None

    return (
        ranked_ids.index(expected_transition_id)
        + 1
    )


def evaluate_ranker(
    defects: pd.DataFrame,
    changes: pd.DataFrame,
) -> tuple[pd.DataFrame, dict[str, float]]:
    """
    DefectChangeRanker'ı bütün sentetik defectler üzerinde değerlendirir.
    """

    ranker = DefectChangeRanker()

    evaluation_rows: list[dict[str, object]] = []

    total_changes = len(changes)

    for index, (_, defect) in enumerate(
        defects.iterrows(),
        start=1,
    ):
        defect_id = str(
            defect["defect_id"]
        ).strip()

        print(
            f"[{index}/{len(defects)}] "
            f"{defect_id} değerlendiriliyor..."
        )
        ranking = ranker.rank(
            defect_text=defect["defect_text"],
            changes_dataframe=changes,
            top_k=total_changes,
        )

        expected_transition_id = str(
            defect["expected_transition_id"]
        ).strip()

        gold_rank = find_gold_rank(
            ranking,
            expected_transition_id,
        )

        ranked_ids = ranking["change_id"].tolist()

        evaluation_rows.append(
            {
                "defect_id": defect_id,
                "defect_text": defect["defect_text"],
                "expected_requirement_id": defect[
                    "expected_requirement_id"
                ],
                "expected_transition_id":
                    expected_transition_id,
                "expected_change_type": defect[
                    "expected_change_type"
                ],
                "difficulty": defect["difficulty"],
                "relation_level": defect[
                    "relation_level"
                ],
                "predicted_rank_1": (
                    ranked_ids[0]
                    if len(ranked_ids) >= 1
                    else None
                ),
                "predicted_rank_2": (
                    ranked_ids[1]
                    if len(ranked_ids) >= 2
                    else None
                ),
                "predicted_rank_3": (
                    ranked_ids[2]
                    if len(ranked_ids) >= 3
                    else None
                ),
                "predicted_rank_4": (
                    ranked_ids[3]
                    if len(ranked_ids) >= 4
                    else None
                ),
                "predicted_rank_5": (
                    ranked_ids[4]
                    if len(ranked_ids) >= 5
                    else None
                ),
                "gold_rank": gold_rank,
            }
        )

    results = pd.DataFrame(
        evaluation_rows
    )

    total_defects = len(results)

    recall_at_1 = (
        results["gold_rank"]
        .apply(
            lambda rank:
                pd.notna(rank)
                and rank <= 1
        )
        .sum()
        / total_defects
    )

    recall_at_3 = (
        results["gold_rank"]
        .apply(
            lambda rank:
                pd.notna(rank)
                and rank <= 3
        )
        .sum()
        / total_defects
    )

    recall_at_5 = (
        results["gold_rank"]
        .apply(
            lambda rank:
                pd.notna(rank)
                and rank <= 5
        )
        .sum()
        / total_defects
    )

    reciprocal_ranks = (
        results["gold_rank"]
        .apply(
            lambda rank:
                0.0
                if pd.isna(rank)
                else 1.0 / float(rank)
        )
    )

    metrics = {
        "Recall@1": float(recall_at_1),
        "Recall@3": float(recall_at_3),
        "Recall@5": float(recall_at_5),
        "MRR": float(
            reciprocal_ranks.mean()
        ),
    }

    return results, metrics


def save_results(
    results: pd.DataFrame,
    metrics: dict[str, float],
) -> None:
    """
    Benchmark sonuçlarını experiments/results klasörüne kaydeder.
    """

    RESULTS_DIRECTORY.mkdir(
        parents=True,
        exist_ok=True,
    )

    detailed_result_path = (
        RESULTS_DIRECTORY
        / "defect_ranking_evaluation.csv"
    )

    metrics_path = (
        RESULTS_DIRECTORY
        / "defect_ranking_metrics.csv"
    )

    results.to_csv(
        detailed_result_path,
        index=False,
        encoding="utf-8-sig",
    )

    metrics_dataframe = pd.DataFrame(
        [
            {
                "metric": metric,
                "value": value,
            }
            for metric, value
            in metrics.items()
        ]
    )

    metrics_dataframe.to_csv(
        metrics_path,
        index=False,
        encoding="utf-8-sig",
    )

    print()
    print(
        f"Detaylı sonuçlar: "
        f"{detailed_result_path}"
    )

    print(
        f"Metrikler: {metrics_path}"
    )


def main() -> None:
    print(
        "ScopeDiff AI - Defect Ranking Evaluation"
    )
    print("-" * 50)

    transitions, defects = (
        load_evaluation_data()
    )

    print(
        f"Transition sayısı: {len(transitions)}"
    )

    print(
        f"Defect sayısı: {len(defects)}"
    )

    print()

    changes = build_change_candidates(
        transitions
    )

    print(
        f"Ranking aday sayısı: {len(changes)}"
    )

    print()

    results, metrics = evaluate_ranker(
        defects,
        changes,
    )

    print()
    print("=" * 50)
    print("EVALUATION RESULTS")
    print("=" * 50)

    for metric_name, value in metrics.items():
        print(
            f"{metric_name:<10}: "
            f"{value:.4f} "
            f"({value * 100:.1f}%)"
        )

    save_results(
        results,
        metrics,
    )


if __name__ == "__main__":
    main()