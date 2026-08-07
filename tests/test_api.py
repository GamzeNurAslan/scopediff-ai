from pathlib import Path

import pytest
from fastapi.testclient import (
    TestClient,
)
from sqlalchemy.orm import sessionmaker

from backend.app.database.database import (
    Base,
    build_engine,
    get_db,
)
from backend.app.main import (
    create_app,
)


@pytest.fixture
def client(
    tmp_path: Path,
):
    database_path = (
        tmp_path
        / "test_api.db"
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
        autoflush=False,
        expire_on_commit=False,
    )

    application = create_app(
        initialize_database=False
    )

    def override_get_db():
        database = TestSession()

        try:
            yield database
        finally:
            database.close()

    application.dependency_overrides[
        get_db
    ] = override_get_db

    with TestClient(
        application
    ) as test_client:
        yield test_client

    engine.dispose()


def test_health_endpoint(
    client: TestClient,
) -> None:
    response = client.get(
        "/health"
    )

    assert response.status_code == 200

    assert response.json() == {
        "status": "ok",
        "service": "ScopeDiff AI",
    }


def test_create_analysis(
    client: TestClient,
) -> None:
    response = client.post(
        "/analyses",
        json={
            "analysis_name":
                "v1 to v2 analysis",
            "source_version": "v1",
            "target_version": "v2",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["id"] > 0

    assert (
        data["analysis_name"]
        == "v1 to v2 analysis"
    )

    assert data[
        "requirement_changes"
    ] == []

    assert data[
        "defect_rankings"
    ] == []


def test_create_analysis_with_results(
    client: TestClient,
) -> None:
    response = client.post(
        "/analyses",
        json={
            "analysis_name":
                "Full Analysis",
            "source_version": "v1",
            "target_version": "v2",
            "requirement_changes": [
                {
                    "old_requirement_id":
                        "REQ-001",
                    "new_requirement_id":
                        "REQ-001",
                    "change_type":
                        "numeric_change",
                    "risk_score": 65.0,
                    "risk_level": "high",
                    "confidence": 0.91,
                    "explanation":
                        "Sayısal sınır değişti.",
                }
            ],
            "defect_rankings": [
                {
                    "defect_id":
                        "DEF-001",
                    "defect_text":
                        (
                            "Port kontrolü "
                            "sürekli tekrar ediyor."
                        ),
                    "change_id":
                        "TR-001-2",
                    "relevance_score":
                        0.88,
                    "rank_position":
                        1,
                    "reason":
                        (
                            "İncelenmesi gereken "
                            "aday değişiklik."
                        ),
                }
            ],
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert len(
        data["requirement_changes"]
    ) == 1

    assert len(
        data["defect_rankings"]
    ) == 1

    assert (
        data[
            "requirement_changes"
        ][0]["risk_score"]
        == 65.0
    )


def test_list_analyses(
    client: TestClient,
) -> None:
    client.post(
        "/analyses",
        json={
            "analysis_name": "First",
        },
    )

    client.post(
        "/analyses",
        json={
            "analysis_name": "Second",
        },
    )

    response = client.get(
        "/analyses"
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 2

    assert (
        data[0]["analysis_name"]
        == "Second"
    )

    assert (
        data[1]["analysis_name"]
        == "First"
    )


def test_get_analysis_detail(
    client: TestClient,
) -> None:
    create_response = client.post(
        "/analyses",
        json={
            "analysis_name":
                "Detail Test",
            "source_version": "v2",
            "target_version": "v3",
        },
    )

    analysis_id = (
        create_response.json()["id"]
    )

    response = client.get(
        f"/analyses/{analysis_id}"
    )

    assert response.status_code == 200

    assert (
        response.json()[
            "analysis_name"
        ]
        == "Detail Test"
    )


def test_unknown_analysis_returns_404(
    client: TestClient,
) -> None:
    response = client.get(
        "/analyses/99999"
    )

    assert response.status_code == 404

    assert response.json() == {
        "detail": "Analysis not found."
    }


def test_invalid_scores_are_rejected(
    client: TestClient,
) -> None:
    response = client.post(
        "/analyses",
        json={
            "analysis_name":
                "Invalid Analysis",
            "requirement_changes": [
                {
                    "change_type":
                        "changed",
                    "risk_score":
                        150.0,
                    "risk_level":
                        "critical",
                }
            ],
        },
    )

    assert response.status_code == 422