from __future__ import annotations

import os
import shutil
from datetime import datetime
from pathlib import Path
from tempfile import NamedTemporaryFile

import pandas as pd
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import (
    Session,
    selectinload,
)
from starlette.background import BackgroundTask

from backend.app.data_loader import (
    FileLoadingError,
    load_requirements_excel,
)
from backend.app.database.database import get_db
from backend.app.database.models import (
    AnalysisRun,
    DefectRanking,
    RequirementChange,
)
from backend.app.matching.semantic_matcher import (
    SemanticRequirementMatcher,
)
from backend.app.pipeline.analysis_pipeline import (
    ScopeDiffAnalysisPipeline,
)
from backend.app.reports.excel_report import (
    ExcelReportGenerator,
)


router = APIRouter()


class RequirementChangeCreate(BaseModel):
    old_requirement_id: str | None = None
    new_requirement_id: str | None = None

    old_requirement_text: str | None = None
    new_requirement_text: str | None = None

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
        default_factory=list,
    )

    defect_rankings: list[
        DefectRankingCreate
    ] = Field(
        default_factory=list,
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
                old_requirement_text=(
                    change.old_requirement_text
                ),
                new_requirement_text=(
                    change.new_requirement_text
                ),
                change_type=change.change_type,
                risk_score=change.risk_score,
                risk_level=change.risk_level,
                confidence=change.confidence,
                explanation=change.explanation,
            )
            for change in analysis.requirement_changes
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
            for ranking in analysis.defect_rankings
        ],
    )


def _load_analysis(
    analysis_id: int,
    database: Session,
) -> AnalysisRun:
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
        database.scalars(statement)
        .first()
    )

    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found.",
        )

    return analysis


def _validate_excel_upload(
    upload_file: UploadFile,
) -> None:
    filename = upload_file.filename or ""

    extension = (
        Path(filename)
        .suffix
        .lower()
    )

    if extension != ".xlsx":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Yalnızca .xlsx uzantılı "
                "Excel dosyaları desteklenmektedir."
            ),
        )


def _save_upload_to_temp(
    upload_file: UploadFile,
) -> str:
    _validate_excel_upload(
        upload_file
    )

    with NamedTemporaryFile(
        suffix=".xlsx",
        delete=False,
    ) as temporary_file:
        upload_file.file.seek(0)

        shutil.copyfileobj(
            upload_file.file,
            temporary_file,
        )

        temporary_path = temporary_file.name

    if os.path.getsize(temporary_path) == 0:
        _delete_temp_file(
            temporary_path
        )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yüklenen Excel dosyası boş.",
        )

    return temporary_path


def _delete_temp_file(
    file_path: str,
) -> None:
    try:
        os.remove(file_path)
    except FileNotFoundError:
        pass


def _extract_version(
    dataframe: pd.DataFrame,
    fallback: str,
) -> str:
    if "version" not in dataframe.columns:
        return fallback

    values = (
        dataframe["version"]
        .astype(str)
        .str.strip()
    )

    values = values[
        ~values
        .str.lower()
        .isin(
            {
                "",
                "nan",
                "none",
            }
        )
    ]

    if values.empty:
        return fallback

    return str(
        values.iloc[0]
    )


def _optional_string(
    value: object,
) -> str | None:
    if value is None:
        return None

    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass

    text = str(value).strip()

    if (
        not text
        or text.lower() == "nan"
    ):
        return None

    return text


def _optional_float(
    value: object,
) -> float | None:
    if value is None:
        return None

    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        return None

    return float(value)


def _delete_temp_report(
    file_path: str,
) -> None:
    _delete_temp_file(
        file_path
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
                old_requirement_text=(
                    change.old_requirement_text
                ),
                new_requirement_text=(
                    change.new_requirement_text
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

    database.add(analysis)
    database.commit()
    database.refresh(analysis)

    return _to_detail(
        analysis
    )


@router.post(
    "/analyses/compare",
    response_model=AnalysisDetail,
    status_code=status.HTTP_201_CREATED,
)
def compare_uploaded_requirements(
    source_file: UploadFile = File(...),
    target_file: UploadFile = File(...),
    analysis_name: str = Form(default=""),
    database: Session = Depends(get_db),
) -> AnalysisDetail:
    source_path: str | None = None
    target_path: str | None = None

    try:
        source_path = _save_upload_to_temp(
            source_file
        )

        target_path = _save_upload_to_temp(
            target_file
        )

        old_dataframe = (
            load_requirements_excel(
                source_path
            )
        )

        new_dataframe = (
            load_requirements_excel(
                target_path
            )
        )

        matcher = SemanticRequirementMatcher()

        pipeline = ScopeDiffAnalysisPipeline(
            matcher=matcher,
        )

        result_dataframe = pipeline.analyze(
            old_dataframe=old_dataframe,
            new_dataframe=new_dataframe,
            top_k=5,
        )

        source_version = _extract_version(
            old_dataframe,
            fallback="source",
        )

        target_version = _extract_version(
            new_dataframe,
            fallback="target",
        )

        clean_analysis_name = (
            analysis_name.strip()
        )

        if not clean_analysis_name:
            clean_analysis_name = (
                f"{source_version} → "
                f"{target_version} Analizi"
            )

        analysis = AnalysisRun(
            analysis_name=clean_analysis_name,
            source_version=source_version,
            target_version=target_version,
        )

        for _, row in result_dataframe.iterrows():
            change_type = str(
                row["change_type"]
            ).strip()

            if change_type.lower() == "unchanged":
                continue

            confidence = _optional_float(
                row["confidence"]
            )

            analysis.requirement_changes.append(
                RequirementChange(
                    old_requirement_id=(
                        _optional_string(
                            row[
                                "old_requirement_id"
                            ]
                        )
                    ),
                    new_requirement_id=(
                        _optional_string(
                            row[
                                "new_requirement_id"
                            ]
                        )
                    ),

                    # Pipeline çıktısındaki
                    # gerçek gereksinim metinleri.
                    old_requirement_text=(
                        _optional_string(
                            row["old_text"]
                        )
                    ),
                    new_requirement_text=(
                        _optional_string(
                            row["new_text"]
                        )
                    ),

                    change_type=change_type,

                    risk_score=float(
                        row["risk_score"]
                    ),

                    risk_level=str(
                        row["risk_level"]
                    ).strip(),

                    confidence=confidence,

                    explanation=(
                        _optional_string(
                            row[
                                "risk_explanation"
                            ]
                        )
                    ),
                )
            )

        database.add(analysis)
        database.commit()
        database.refresh(analysis)

        return _to_detail(
            analysis
        )

    except HTTPException:
        database.rollback()
        raise

    except FileLoadingError as error:
        database.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    except ValueError as error:
        database.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    except Exception:
        database.rollback()
        raise

    finally:
        if source_path is not None:
            _delete_temp_file(
                source_path
            )

        if target_path is not None:
            _delete_temp_file(
                target_path
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
    analysis = _load_analysis(
        analysis_id=analysis_id,
        database=database,
    )

    return _to_detail(
        analysis
    )


@router.get(
    "/analyses/{analysis_id}/report",
    response_class=FileResponse,
)
def download_analysis_report(
    analysis_id: int,
    database: Session = Depends(get_db),
) -> FileResponse:
    analysis = _load_analysis(
        analysis_id=analysis_id,
        database=database,
    )

    with NamedTemporaryFile(
        suffix=".xlsx",
        delete=False,
    ) as temporary_file:
        output_path = temporary_file.name

    try:
        generator = ExcelReportGenerator()

        generator.generate(
            analysis=analysis,
            output_path=output_path,
        )

    except Exception:
        _delete_temp_report(
            output_path
        )
        raise

    download_filename = (
        f"ScopeDiff_Analysis_"
        f"{analysis.id}.xlsx"
    )

    return FileResponse(
        path=output_path,
        media_type=(
            "application/"
            "vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        filename=download_filename,
        background=BackgroundTask(
            _delete_temp_report,
            output_path,
        ),
    )