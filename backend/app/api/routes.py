from __future__ import annotations

from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from pydantic import (
    BaseModel,
    Field,
)
from sqlalchemy import select
from sqlalchemy.orm import (
    Session,
    selectinload,
)

from backend.app.database.database import (
    get_db,
)
from backend.app.database.models import (
    AnalysisRun,
    DefectRanking,
    RequirementChange,
)


router = APIRouter()


class RequirementChangeCreate(BaseModel):
    old_requirement_id: str | None = None
    new_requirement_id: str | None = None

    change_type: str

    risk_score: float = Field(
        ge=0.0,
        le=100.0,
    )

    risk_level: str

    confidence: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
    )

    explanation: str | None = None


class DefectRankingCreate(BaseModel):
    defect_id: str | None = None

    defect_text: str

    change_id: str | None = None

    relevance_score: float = Field(
        ge=0.0,
        le=1.0,
    )

    rank_position: int = Field(
        ge=1,
    )

    reason: str | None = None


class AnalysisCreate(BaseModel):
    analysis_name: str = Field(
        min_length=1,
        max_length=200,
    )

    source_version: str | None = None
    target_version: str | None = None

    requirement_changes: list[
        RequirementChangeCreate
    ] = Field(
        default_factory=list
    )

    defect_rankings: list[
        DefectRankingCreate
    ] = Field(
        default_factory=list
    )


class RequirementChangeResponse(
    RequirementChangeCreate
):
    id: int


class DefectRankingResponse(
    DefectRankingCreate
):
    id: int


class AnalysisSummary(BaseModel):
    id: int
    analysis_name: str
    source_version: str | None
    target_version: str | None
    created_at: datetime

    requirement_change_count: int
    defect_ranking_count: int


class AnalysisDetail(BaseModel):
    id: int
    analysis_name: str
    source_version: str | None
    target_version: str | None
    created_at: datetime

    requirement_changes: list[
        RequirementChangeResponse
    ]

    defect_rankings: list[
        DefectRankingResponse
    ]


def _to_summary(
    analysis: AnalysisRun,
) -> AnalysisSummary:
    return AnalysisSummary(
        id=analysis.id,
        analysis_name=analysis.analysis_name,
        source_version=analysis.source_version,
        target_version=analysis.target_version,
        created_at=analysis.created_at,
        requirement_change_count=len(
            analysis.requirement_changes
        ),
        defect_ranking_count=len(
            analysis.defect_rankings
        ),
    )


def _to_detail(
    analysis: AnalysisRun,
) -> AnalysisDetail:
    return AnalysisDetail(
        id=analysis.id,
        analysis_name=analysis.analysis_name,
        source_version=analysis.source_version,
        target_version=analysis.target_version,
        created_at=analysis.created_at,
        requirement_changes=[
            RequirementChangeResponse(
                id=change.id,
                old_requirement_id=(
                    change.old_requirement_id
                ),
                new_requirement_id=(
                    change.new_requirement_id
                ),
                change_type=change.change_type,
                risk_score=change.risk_score,
                risk_level=change.risk_level,
                confidence=change.confidence,
                explanation=change.explanation,
            )
            for change
            in analysis.requirement_changes
        ],
        defect_rankings=[
            DefectRankingResponse(
                id=ranking.id,
                defect_id=ranking.defect_id,
                defect_text=ranking.defect_text,
                change_id=ranking.change_id,
                relevance_score=(
                    ranking.relevance_score
                ),
                rank_position=(
                    ranking.rank_position
                ),
                reason=ranking.reason,
            )
            for ranking
            in analysis.defect_rankings
        ],
    )


@router.post(
    "/analyses",
    response_model=AnalysisDetail,
    status_code=status.HTTP_201_CREATED,
)
def create_analysis(
    payload: AnalysisCreate,
    database: Session = Depends(get_db),
) -> AnalysisDetail:
    analysis = AnalysisRun(
        analysis_name=payload.analysis_name,
        source_version=payload.source_version,
        target_version=payload.target_version,
    )

    for change in payload.requirement_changes:
        analysis.requirement_changes.append(
            RequirementChange(
                old_requirement_id=(
                    change.old_requirement_id
                ),
                new_requirement_id=(
                    change.new_requirement_id
                ),
                change_type=change.change_type,
                risk_score=change.risk_score,
                risk_level=change.risk_level,
                confidence=change.confidence,
                explanation=change.explanation,
            )
        )

    for ranking in payload.defect_rankings:
        analysis.defect_rankings.append(
            DefectRanking(
                defect_id=ranking.defect_id,
                defect_text=ranking.defect_text,
                change_id=ranking.change_id,
                relevance_score=(
                    ranking.relevance_score
                ),
                rank_position=(
                    ranking.rank_position
                ),
                reason=ranking.reason,
            )
        )

    database.add(
        analysis
    )

    database.commit()

    database.refresh(
        analysis
    )

    return _to_detail(
        analysis
    )


@router.get(
    "/analyses",
    response_model=list[AnalysisSummary],
)
def list_analyses(
    database: Session = Depends(get_db),
) -> list[AnalysisSummary]:
    statement = (
        select(AnalysisRun)
        .options(
            selectinload(
                AnalysisRun.requirement_changes
            ),
            selectinload(
                AnalysisRun.defect_rankings
            ),
        )
        .order_by(
            AnalysisRun.id.desc()
        )
    )

    analyses = (
        database.scalars(
            statement
        )
        .all()
    )

    return [
        _to_summary(analysis)
        for analysis in analyses
    ]


@router.get(
    "/analyses/{analysis_id}",
    response_model=AnalysisDetail,
)
def get_analysis(
    analysis_id: int,
    database: Session = Depends(get_db),
) -> AnalysisDetail:
    statement = (
        select(AnalysisRun)
        .options(
            selectinload(
                AnalysisRun.requirement_changes
            ),
            selectinload(
                AnalysisRun.defect_rankings
            ),
        )
        .where(
            AnalysisRun.id == analysis_id
        )
    )

    analysis = (
        database.scalars(
            statement
        )
        .first()
    )

    if analysis is None:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found.",
        )

    return _to_detail(
        analysis
    )