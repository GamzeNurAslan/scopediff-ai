from pathlib import Path

from sqlalchemy import inspect, text
from sqlalchemy.orm import sessionmaker

from backend.app.database.database import (
    Base,
    build_engine,
)
from backend.app.database.models import (
    AnalysisRun,
    DefectRanking,
    RequirementChange,
)


def create_test_database(
    tmp_path: Path,
):
    database_path = (
        tmp_path
        / "test_scopediff.db"
    )

    database_url = (
        f"sqlite:///"
        f"{database_path.as_posix()}"
    )

    engine = build_engine(
        database_url
    )

    Base.metadata.create_all(
        bind=engine
    )

    TestSession = sessionmaker(
        bind=engine,
        expire_on_commit=False,
    )

    return engine, TestSession


def test_expected_tables_are_created(
    tmp_path: Path,
) -> None:
    engine, _ = create_test_database(
        tmp_path
    )

    inspector = inspect(engine)

    tables = set(
        inspector.get_table_names()
    )

    assert "analysis_runs" in tables
    assert (
        "requirement_changes"
        in tables
    )
    assert "defect_rankings" in tables


def test_analysis_run_can_be_saved(
    tmp_path: Path,
) -> None:
    _, TestSession = (
        create_test_database(
            tmp_path
        )
    )

    with TestSession() as session:
        analysis = AnalysisRun(
            analysis_name=(
                "v1 to v2 analysis"
            ),
            source_version="v1",
            target_version="v2",
        )

        session.add(analysis)
        session.commit()

        assert analysis.id is not None

        stored = session.get(
            AnalysisRun,
            analysis.id,
        )

        assert stored is not None

        assert (
            stored.analysis_name
            == "v1 to v2 analysis"
        )


def test_requirement_change_can_be_saved(
    tmp_path: Path,
) -> None:
    _, TestSession = (
        create_test_database(
            tmp_path
        )
    )

    with TestSession() as session:
        analysis = AnalysisRun(
            analysis_name="Test"
        )

        change = RequirementChange(
            old_requirement_id=(
                "REQ-001"
            ),
            new_requirement_id=(
                "REQ-001"
            ),
            change_type=(
                "numeric_change"
            ),
            risk_score=65.0,
            risk_level="high",
            confidence=0.91,
            explanation=(
                "Sayısal sınır değişti."
            ),
        )

        analysis.requirement_changes.append(
            change
        )

        session.add(analysis)
        session.commit()

        assert change.id is not None

        assert (
            change.analysis_run_id
            == analysis.id
        )


def test_defect_ranking_can_be_saved(
    tmp_path: Path,
) -> None:
    _, TestSession = (
        create_test_database(
            tmp_path
        )
    )

    with TestSession() as session:
        analysis = AnalysisRun(
            analysis_name="Test"
        )

        ranking = DefectRanking(
            defect_id="DEF-001",
            defect_text=(
                "Port kontrolü "
                "sürekli tekrar ediyor."
            ),
            change_id="TR-001-2",
            relevance_score=0.88,
            rank_position=1,
            reason=(
                "İncelenmesi gereken "
                "aday değişiklik."
            ),
        )

        analysis.defect_rankings.append(
            ranking
        )

        session.add(analysis)
        session.commit()

        assert ranking.id is not None

        assert (
            ranking.analysis_run_id
            == analysis.id
        )


def test_sqlite_foreign_keys_are_enabled(
    tmp_path: Path,
) -> None:
    engine, _ = create_test_database(
        tmp_path
    )

    with engine.connect() as connection:
        result = connection.execute(
            text(
                "PRAGMA foreign_keys"
            )
        ).scalar_one()

    assert result == 1


def test_deleting_analysis_run_cascades(
    tmp_path: Path,
) -> None:
    _, TestSession = (
        create_test_database(
            tmp_path
        )
    )

    with TestSession() as session:
        analysis = AnalysisRun(
            analysis_name="Cascade Test"
        )

        analysis.requirement_changes.append(
            RequirementChange(
                old_requirement_id=(
                    "REQ-001"
                ),
                new_requirement_id=(
                    "REQ-001"
                ),
                change_type="changed",
                risk_score=50.0,
                risk_level="medium",
            )
        )

        analysis.defect_rankings.append(
            DefectRanking(
                defect_id="DEF-001",
                defect_text=(
                    "Test defect"
                ),
                change_id="TR-001",
                relevance_score=0.80,
                rank_position=1,
            )
        )

        session.add(analysis)
        session.commit()

        analysis_id = analysis.id

        session.delete(analysis)
        session.commit()

        assert (
            session.query(
                RequirementChange
            ).filter_by(
                analysis_run_id=analysis_id
            ).count()
            == 0
        )

        assert (
            session.query(
                DefectRanking
            ).filter_by(
                analysis_run_id=analysis_id
            ).count()
            == 0
        )