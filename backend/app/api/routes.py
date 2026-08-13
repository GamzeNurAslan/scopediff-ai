from __future__ import annotations

import json
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
    Response,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import (
    delete,
    select,
    update,
)
from sqlalchemy.orm import (
    Session,
    selectinload,
)
from starlette.background import BackgroundTask

from backend.app.api.history_routes import (
    router as history_router,
)
from backend.app.api.process_tracking import (
    router as process_tracking_router,
)
from backend.app.data_loader import (
    detect_requirement_columns,
    load_requirements_excel,
    standardize_column_names,
)
from backend.app.database.database import (
    get_db,
)
from backend.app.database.models import (
    AnalysisRun,
    DefectRanking,
    RequirementChange,
    WorkItem,
)
from backend.app.defects.defect_change_ranker import (
    DefectChangeRanker,
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

router.include_router(
    history_router,
)

router.include_router(
    process_tracking_router,
)





class RequirementChangeCreate(BaseModel):
    old_requirement_id: str | None = None
    new_requirement_id: str | None = None

    old_requirement_text: str | None = None
    new_requirement_text: str | None = None

    detailed_change_types: list[str] = Field(
        default_factory=list,
    )

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

    created_by_user_id: str | None = Field(
        default=None,
        max_length=200,
    )

    created_by_name: str | None = Field(
        default=None,
        max_length=200,
    )

    created_by_email: str | None = Field(
        default=None,
        max_length=320,
    )

    created_by_department: str | None = Field(
        default=None,
        max_length=200,
    )

    created_by_role: str | None = Field(
        default=None,
        max_length=200,
    )

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

    created_by_user_id: str | None
    created_by_name: str | None
    created_by_email: str | None
    created_by_department: str | None
    created_by_role: str | None

    created_at: datetime

    requirement_change_count: int
    defect_ranking_count: int


class AnalysisDetail(BaseModel):
    id: int

    analysis_name: str

    source_version: str | None
    target_version: str | None

    created_by_user_id: str | None
    created_by_name: str | None
    created_by_email: str | None
    created_by_department: str | None
    created_by_role: str | None

    created_at: datetime

    requirement_changes: list[
        RequirementChangeResponse
    ]

    defect_rankings: list[
        DefectRankingResponse
    ]




class DefectAnalysisRequest(BaseModel):
    defect_id: str | None = Field(
        default=None,
        max_length=100,
    )

    defect_text: str = Field(
        min_length=3,
        max_length=5000,
    )

    top_k: int = Field(
        default=5,
        ge=1,
        le=10,
    )

    min_relevance: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
    )


class DefectCandidateResponse(BaseModel):
    change_id: str

    old_requirement_id: str | None
    new_requirement_id: str | None

    old_requirement_text: str | None
    new_requirement_text: str | None

    detailed_change_types: list[str]

    change_type: str

    risk_score: float
    risk_level: str
    confidence: float | None

    semantic_similarity: float
    keyword_overlap: float
    relevance_score: float

    rank: int

    reason: str


class DefectAnalysisResponse(BaseModel):
    analysis_id: int

    analysis_name: str

    defect_id: str
    defect_text: str

    candidate_count: int

    candidates: list[
        DefectCandidateResponse
    ]


class ContentTranslationRequest(BaseModel):
    texts: list[str] = Field(
        default_factory=list,
        max_length=80,
    )

    target_language: str = Field(
        min_length=2,
        max_length=2,
    )


class ContentTranslationResponse(BaseModel):
    translations: list[str]




def _to_summary(
    analysis: AnalysisRun,
) -> AnalysisSummary:
    return AnalysisSummary(
        id=analysis.id,

        analysis_name=(
            analysis.analysis_name
        ),

        source_version=(
            analysis.source_version
        ),

        target_version=(
            analysis.target_version
        ),

        created_by_user_id=(
            analysis.created_by_user_id
        ),

        created_by_name=(
            analysis.created_by_name
        ),

        created_by_email=(
            analysis.created_by_email
        ),

        created_by_department=(
            analysis.created_by_department
        ),

        created_by_role=(
            analysis.created_by_role
        ),

        created_at=(
            analysis.created_at
        ),

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
    requirement_changes = [
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

            detailed_change_types=list(
                change.detailed_change_types
                or []
            ),

            change_type=(
                change.change_type
            ),

            risk_score=float(
                change.risk_score
            ),

            risk_level=(
                change.risk_level
            ),

            confidence=(
                change.confidence
            ),

            explanation=(
                change.explanation
            ),
        )
        for change
        in analysis.requirement_changes
    ]

    defect_rankings = [
        DefectRankingResponse(
            id=ranking.id,

            defect_id=(
                ranking.defect_id
            ),

            defect_text=(
                ranking.defect_text
            ),

            change_id=(
                ranking.change_id
            ),

            relevance_score=float(
                ranking.relevance_score
            ),

            rank_position=(
                ranking.rank_position
            ),

            reason=(
                ranking.reason
            ),
        )
        for ranking
        in analysis.defect_rankings
    ]

    return AnalysisDetail(
        id=analysis.id,

        analysis_name=(
            analysis.analysis_name
        ),

        source_version=(
            analysis.source_version
        ),

        target_version=(
            analysis.target_version
        ),

        created_by_user_id=(
            analysis.created_by_user_id
        ),

        created_by_name=(
            analysis.created_by_name
        ),

        created_by_email=(
            analysis.created_by_email
        ),

        created_by_department=(
            analysis.created_by_department
        ),

        created_by_role=(
            analysis.created_by_role
        ),

        created_at=(
            analysis.created_at
        ),

        requirement_changes=(
            requirement_changes
        ),

        defect_rankings=(
            defect_rankings
        ),
    )


def _load_analysis(
    analysis_id: int,
    database: Session,
) -> AnalysisRun:
    statement = (
        select(
            AnalysisRun
        )
        .options(
            selectinload(
                AnalysisRun.requirement_changes
            ),
            selectinload(
                AnalysisRun.defect_rankings
            ),
        )
        .where(
            AnalysisRun.id
            == analysis_id
        )
    )

    analysis = (
        database
        .scalars(
            statement
        )
        .first()
    )

    if analysis is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "Analysis not found."
            ),
        )

    return analysis




def _optional_string(
    value: object,
) -> str | None:
    if value is None:
        return None

    try:
        if pd.isna(
            value
        ):
            return None

    except (
        TypeError,
        ValueError,
    ):
        pass

    text = str(
        value
    ).strip()

    if (
        not text
        or text.lower()
        in {
            "nan",
            "none",
        }
    ):
        return None

    return text


def _optional_float(
    value: object,
) -> float | None:
    if value is None:
        return None

    try:
        if pd.isna(
            value
        ):
            return None

    except (
        TypeError,
        ValueError,
    ):
        return None

    try:
        return float(
            value
        )

    except (
        TypeError,
        ValueError,
    ):
        return None


def _string_list(
    value: object,
) -> list[str]:
    if value is None:
        return []

    if isinstance(
        value,
        (
            list,
            tuple,
            set,
        ),
    ):
        return [
            str(item).strip()
            for item in value
            if str(item).strip()
        ]

    try:
        if pd.isna(
            value
        ):
            return []

    except (
        TypeError,
        ValueError,
    ):
        pass

    text = str(
        value
    ).strip()

    if not text:
        return []

    return [
        text
    ]




def _validate_excel_upload(
    upload_file: UploadFile,
) -> None:
    filename = (
        upload_file.filename
        or ""
    )

    extension = (
        Path(filename)
        .suffix
        .lower()
    )

    if extension != ".xlsx":
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Yalnızca .xlsx "
                "uzantılı Excel "
                "dosyaları desteklenmektedir."
            ),
        )


def _delete_temp_file(
    file_path: str,
) -> None:
    try:
        os.remove(
            file_path
        )

    except FileNotFoundError:
        pass


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
        upload_file.file.seek(
            0
        )

        shutil.copyfileobj(
            upload_file.file,
            temporary_file,
        )

        temporary_path = (
            temporary_file.name
        )

    if (
        os.path.getsize(
            temporary_path
        )
        == 0
    ):
        _delete_temp_file(
            temporary_path
        )

        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Yüklenen Excel "
                "dosyası boş."
            ),
        )

    return temporary_path


def _extract_version(
    dataframe: pd.DataFrame,
    fallback: str,
) -> str:
    if (
        "version"
        not in dataframe.columns
    ):
        return fallback

    values = (
        dataframe[
            "version"
        ]
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




def _next_defect_id(
    analysis: AnalysisRun,
) -> str:
    used_ids = {
        ranking.defect_id
        for ranking
        in analysis.defect_rankings
        if ranking.defect_id
    }

    index = 1

    while True:
        candidate = (
            f"DEF-A{analysis.id}-"
            f"{index:03d}"
        )

        if (
            candidate
            not in used_ids
        ):
            return candidate

        index += 1


def _build_changes_dataframe(
    analysis: AnalysisRun,
) -> pd.DataFrame:
    rows: list[
        dict[str, object]
    ] = []

    for change in (
        analysis.requirement_changes
    ):
        rows.append(
            {
                "change_id":
                    str(change.id),

                "old_requirement_id":
                    change.old_requirement_id,

                "new_requirement_id":
                    change.new_requirement_id,

                "old_text":
                    change.old_requirement_text,

                "new_text":
                    change.new_requirement_text,

                "change_type":
                    change.change_type,

                "risk_score":
                    change.risk_score,
            }
        )

    return pd.DataFrame(
        rows,
        columns=[
            "change_id",
            "old_requirement_id",
            "new_requirement_id",
            "old_text",
            "new_text",
            "change_type",
            "risk_score",
        ],
    )




@router.post(
    "/analyses",
    response_model=AnalysisDetail,
    status_code=(
        status.HTTP_201_CREATED
    ),
)
def create_analysis(
    payload: AnalysisCreate,

    database: Session = Depends(
        get_db
    ),
) -> AnalysisDetail:
    analysis = AnalysisRun(
        analysis_name=(
            payload.analysis_name
        ),

        source_version=(
            payload.source_version
        ),

        target_version=(
            payload.target_version
        ),

        created_by_user_id=(
            payload.created_by_user_id
        ),

        created_by_name=(
            payload.created_by_name
        ),

        created_by_email=(
            payload.created_by_email
        ),

        created_by_department=(
            payload.created_by_department
        ),

        created_by_role=(
            payload.created_by_role
        ),
    )

    for change in (
        payload.requirement_changes
    ):
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

                detailed_change_types=list(
                    change.detailed_change_types
                ),

                change_type=(
                    change.change_type
                ),

                risk_score=(
                    change.risk_score
                ),

                risk_level=(
                    change.risk_level
                ),

                confidence=(
                    change.confidence
                ),

                explanation=(
                    change.explanation
                ),
            )
        )

    for ranking in (
        payload.defect_rankings
    ):
        analysis.defect_rankings.append(
            DefectRanking(
                defect_id=(
                    ranking.defect_id
                ),

                defect_text=(
                    ranking.defect_text
                ),

                change_id=(
                    ranking.change_id
                ),

                relevance_score=(
                    ranking.relevance_score
                ),

                rank_position=(
                    ranking.rank_position
                ),

                reason=(
                    ranking.reason
                ),
            )
        )

    try:
        database.add(
            analysis
        )

        database.commit()

        analysis = _load_analysis(
            analysis_id=analysis.id,
            database=database,
        )

        return _to_detail(
            analysis
        )

    except Exception:
        database.rollback()

        raise




@router.post("/requirements/preview")
def preview_requirement_file(
    file: UploadFile = File(...),
):
    if not (file.filename or "").lower().endswith(".xlsx"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yalnızca .xlsx dosyaları destekleniyor.",
        )

    temporary_path: str | None = None
    try:
        temporary_path = _save_upload_to_temp(file)
        workbook = pd.read_excel(
            temporary_path,
            sheet_name=None,
            engine="openpyxl",
        )
        sheets = []
        for sheet_name, frame in workbook.items():
            if frame.empty and len(frame.columns) == 0:
                continue
            normalized = standardize_column_names(frame)
            mapping = detect_requirement_columns(list(normalized.columns))
            sample = normalized.head(5).where(pd.notna(normalized.head(5)), None)
            sheets.append({
                "name": str(sheet_name),
                "rows": int(len(frame.index)),
                "columns": [str(column) for column in normalized.columns],
                "mapping": mapping,
                "sample_rows": sample.to_dict(orient="records"),
                "warnings": (
                    ["Gereksinim metni kolonu otomatik bulunamadı."]
                    if not mapping.get("requirement_text")
                    else []
                ),
            })

        if not sheets:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Dosyada okunabilir bir sayfa bulunamadı.",
            )

        selected = next(
            (sheet for sheet in sheets if sheet["mapping"].get("requirement_text")),
            sheets[0],
        )
        return {
            "filename": file.filename,
            "selected_sheet": selected["name"],
            "sheets": sheets,
        }
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dosya önizlenemedi: {error}",
        ) from error
    finally:
        if temporary_path and Path(temporary_path).exists():
            Path(temporary_path).unlink(missing_ok=True)


@router.post(
    "/analyses/compare",
    response_model=AnalysisDetail,
    status_code=(
        status.HTTP_201_CREATED
    ),
)
def compare_uploaded_requirements(
    source_file: UploadFile = File(
        ...
    ),

    target_file: UploadFile = File(
        ...
    ),

    analysis_name: str = Form(
        default="",
    ),

    created_by_user_id: str = Form(
        default="",
    ),

    created_by_name: str = Form(
        default="",
    ),

    created_by_email: str = Form(
        default="",
    ),

    created_by_department: str = Form(
        default="",
    ),

    created_by_role: str = Form(
        default="",
    ),

    source_sheet: str = Form(default=""),

    target_sheet: str = Form(default=""),

    source_mapping_json: str = Form(default="{}"),

    target_mapping_json: str = Form(default="{}"),

    database: Session = Depends(
        get_db
    ),
) -> AnalysisDetail:
    source_path: str | None = None
    target_path: str | None = None

    try:
        source_path = (
            _save_upload_to_temp(
                source_file
            )
        )

        target_path = (
            _save_upload_to_temp(
                target_file
            )
        )

        try:
            source_mapping = json.loads(source_mapping_json or "{}")
            target_mapping = json.loads(target_mapping_json or "{}")

            old_dataframe = (
                load_requirements_excel(
                    source_path,
                    sheet_name=source_sheet or 0,
                    column_mapping=source_mapping,
                )
            )

            new_dataframe = (
                load_requirements_excel(
                    target_path,
                    sheet_name=target_sheet or 0,
                    column_mapping=target_mapping,
                )
            )

        except Exception as error:
            raise HTTPException(
                status_code=(
                    status.HTTP_400_BAD_REQUEST
                ),

                detail=str(
                    error
                ),
            ) from error

        matcher = (
            SemanticRequirementMatcher()
        )

        pipeline = (
            ScopeDiffAnalysisPipeline(
                matcher=matcher,
            )
        )

        result_dataframe = (
            pipeline.analyze(
                old_dataframe=(
                    old_dataframe
                ),

                new_dataframe=(
                    new_dataframe
                ),

                top_k=5,
            )
        )

        source_version = (
            _extract_version(
                old_dataframe,
                fallback="source",
            )
        )

        target_version = (
            _extract_version(
                new_dataframe,
                fallback="target",
            )
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
            analysis_name=(
                clean_analysis_name
            ),

            source_version=(
                source_version
            ),

            target_version=(
                target_version
            ),

            created_by_user_id=(
                _optional_string(
                    created_by_user_id
                )
            ),

            created_by_name=(
                _optional_string(
                    created_by_name
                )
            ),

            created_by_email=(
                _optional_string(
                    created_by_email
                )
            ),

            created_by_department=(
                _optional_string(
                    created_by_department
                )
            ),

            created_by_role=(
                _optional_string(
                    created_by_role
                )
            ),
        )

        for (
            _,
            row,
        ) in result_dataframe.iterrows():
            change_type = str(
                row.get(
                    "change_type",
                    "",
                )
            ).strip()

            if (
                not change_type
                or change_type.lower()
                == "unchanged"
            ):
                continue

            detailed_change_types = (
                _string_list(
                    row.get(
                        "detailed_change_types"
                    )
                )
            )

            analysis.requirement_changes.append(
                RequirementChange(
                    old_requirement_id=(
                        _optional_string(
                            row.get(
                                "old_requirement_id"
                            )
                        )
                    ),

                    new_requirement_id=(
                        _optional_string(
                            row.get(
                                "new_requirement_id"
                            )
                        )
                    ),

                    old_requirement_text=(
                        _optional_string(
                            row.get(
                                "old_text"
                            )
                        )
                    ),

                    new_requirement_text=(
                        _optional_string(
                            row.get(
                                "new_text"
                            )
                        )
                    ),

                    detailed_change_types=(
                        detailed_change_types
                    ),

                    change_type=(
                        change_type
                    ),

                    risk_score=float(
                        row.get(
                            "risk_score",
                            0.0,
                        )
                    ),

                    risk_level=str(
                        row.get(
                            "risk_level",
                            "low",
                        )
                    ).strip(),

                    confidence=(
                        _optional_float(
                            row.get(
                                "confidence"
                            )
                        )
                    ),

                    explanation=(
                        _optional_string(
                            row.get(
                                "risk_explanation"
                            )
                        )
                    ),
                )
            )

        database.add(
            analysis
        )

        database.commit()

        analysis = _load_analysis(
            analysis_id=analysis.id,
            database=database,
        )

        return _to_detail(
            analysis
        )

    except HTTPException:
        database.rollback()

        raise

    except ValueError as error:
        database.rollback()

        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),

            detail=str(
                error
            ),
        ) from error

    except Exception:
        database.rollback()

        raise

    finally:
        if (
            source_path
            is not None
        ):
            _delete_temp_file(
                source_path
            )

        if (
            target_path
            is not None
        ):
            _delete_temp_file(
                target_path
            )




@router.post(
    "/analyses/{analysis_id}/defect-rankings",
    response_model=DefectAnalysisResponse,
)
def analyze_defect(
    analysis_id: int,

    payload: DefectAnalysisRequest,

    database: Session = Depends(
        get_db
    ),
) -> DefectAnalysisResponse:
    analysis = _load_analysis(
        analysis_id=analysis_id,
        database=database,
    )

    if (
        not analysis
        .requirement_changes
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),

            detail=(
                "Bu analizde defect ile "
                "karşılaştırılabilecek "
                "değişiklik bulunmuyor."
            ),
        )

    defect_text = (
        payload
        .defect_text
        .strip()
    )

    if (
        payload.defect_id
        and payload.defect_id.strip()
    ):
        defect_id = (
            payload.defect_id.strip()
        )

    else:
        defect_id = (
            _next_defect_id(
                analysis
            )
        )

    changes_dataframe = (
        _build_changes_dataframe(
            analysis
        )
    )

    ranker = (
        DefectChangeRanker()
    )

    try:
        ranking_dataframe = (
            ranker.rank(
                defect_text=(
                    defect_text
                ),

                changes_dataframe=(
                    changes_dataframe
                ),

                top_k=(
                    payload.top_k
                ),

                min_relevance=(
                    payload.min_relevance
                ),
            )
        )

    except ValueError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),

            detail=str(
                error
            ),
        ) from error

    try:
        database.execute(
            delete(
                DefectRanking
            )
            .where(
                DefectRanking.analysis_run_id
                == analysis.id
            )
            .where(
                DefectRanking.defect_id
                == defect_id
            )
        )

        change_map = {
            str(change.id): change
            for change
            in analysis.requirement_changes
        }

        candidates: list[
            DefectCandidateResponse
        ] = []

        for (
            _,
            row,
        ) in ranking_dataframe.iterrows():
            change_id = (
                _optional_string(
                    row.get(
                        "change_id"
                    )
                )
            )

            if change_id is None:
                continue

            change = (
                change_map.get(
                    change_id
                )
            )

            if change is None:
                continue

            reason = (
                _optional_string(
                    row.get(
                        "reason"
                    )
                )
                or (
                    "Bu sonuç kesin kök "
                    "neden değildir; "
                    "incelenmesi gereken "
                    "aday değişikliklerden "
                    "biridir."
                )
            )

            relevance_score = float(
                row.get(
                    "relevance_score",
                    0.0,
                )
            )

            rank_position = int(
                row.get(
                    "rank",
                    len(candidates) + 1,
                )
            )

            database.add(
                DefectRanking(
                    analysis_run_id=(
                        analysis.id
                    ),

                    defect_id=(
                        defect_id
                    ),

                    defect_text=(
                        defect_text
                    ),

                    change_id=(
                        change_id
                    ),

                    relevance_score=(
                        relevance_score
                    ),

                    rank_position=(
                        rank_position
                    ),

                    reason=(
                        reason
                    ),
                )
            )

            candidates.append(
                DefectCandidateResponse(
                    change_id=(
                        change_id
                    ),

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

                    detailed_change_types=list(
                        change.detailed_change_types
                        or []
                    ),

                    change_type=(
                        change.change_type
                    ),

                    risk_score=float(
                        change.risk_score
                    ),

                    risk_level=(
                        change.risk_level
                    ),

                    confidence=(
                        change.confidence
                    ),

                    semantic_similarity=float(
                        row.get(
                            "semantic_similarity",
                            0.0,
                        )
                    ),

                    keyword_overlap=float(
                        row.get(
                            "keyword_overlap",
                            0.0,
                        )
                    ),

                    relevance_score=(
                        relevance_score
                    ),

                    rank=(
                        rank_position
                    ),

                    reason=(
                        reason
                    ),
                )
            )

        database.commit()

        return DefectAnalysisResponse(
            analysis_id=(
                analysis.id
            ),

            analysis_name=(
                analysis.analysis_name
            ),

            defect_id=(
                defect_id
            ),

            defect_text=(
                defect_text
            ),

            candidate_count=len(
                candidates
            ),

            candidates=(
                candidates
            ),
        )

    except Exception:
        database.rollback()

        raise




@router.get(
    "/analyses",
    response_model=list[
        AnalysisSummary
    ],
)
def list_analyses(
    database: Session = Depends(
        get_db
    ),
) -> list[
    AnalysisSummary
]:
    statement = (
        select(
            AnalysisRun
        )
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
        database
        .scalars(
            statement
        )
        .all()
    )

    return [
        _to_summary(
            analysis
        )
        for analysis
        in analyses
    ]




@router.get(
    "/analyses/{analysis_id}",
    response_model=AnalysisDetail,
)
def get_analysis(
    analysis_id: int,

    database: Session = Depends(
        get_db
    ),
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

    database: Session = Depends(
        get_db
    ),
) -> FileResponse:
    analysis = _load_analysis(
        analysis_id=analysis_id,
        database=database,
    )

    with NamedTemporaryFile(
        suffix=".xlsx",
        delete=False,
    ) as temporary_file:
        output_path = (
            temporary_file.name
        )

    try:
        generator = (
            ExcelReportGenerator()
        )

        generator.generate(
            analysis=analysis,
            output_path=output_path,
        )

    except Exception:
        _delete_temp_file(
            output_path
        )

        raise

    filename = (
        f"ScopeDiff_Analysis_"
        f"{analysis.id}.xlsx"
    )

    return FileResponse(
        path=output_path,

        media_type=(
            "application/"
            "vnd.openxmlformats-"
            "officedocument."
            "spreadsheetml.sheet"
        ),

        filename=filename,

        background=(
            BackgroundTask(
                _delete_temp_file,
                output_path,
            )
        ),
    )




@router.delete(
    "/analyses/{analysis_id}",
    status_code=(
        status.HTTP_204_NO_CONTENT
    ),
)
def delete_analysis(
    analysis_id: int,

    database: Session = Depends(
        get_db
    ),
) -> Response:
    analysis = _load_analysis(
        analysis_id=analysis_id,
        database=database,
    )

    try:

        database.execute(
            update(
                WorkItem
            )
            .where(
                WorkItem.analysis_run_id
                == analysis.id
            )
            .values(
                analysis_run_id=None
            )
        )


        database.execute(
            delete(
                DefectRanking
            ).where(
                DefectRanking.analysis_run_id
                == analysis.id
            )
        )


        database.execute(
            delete(
                RequirementChange
            ).where(
                RequirementChange.analysis_run_id
                == analysis.id
            )
        )


        database.execute(
            delete(
                AnalysisRun
            ).where(
                AnalysisRun.id
                == analysis.id
            )
        )

        database.commit()

    except Exception:
        database.rollback()
        raise

    return Response(
        status_code=(
            status.HTTP_204_NO_CONTENT
        )
    )


@router.post(
    "/translate/content",
    response_model=ContentTranslationResponse,
)
def translate_content_endpoint(
    request: ContentTranslationRequest,
) -> ContentTranslationResponse:
    target_language = (
        request.target_language
        .strip()
        .lower()
    )

    if target_language not in {
        "tr",
        "en",
        "de",
        "fr",
        "es",
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Desteklenmeyen hedef dil: "
                f"{request.target_language}"
            ),
        )

    try:
        from backend.app.translation.content_translator import (
            translate_content_batch,
        )

        translations = translate_content_batch(
            request.texts,
            target_language,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "İçerik çeviri modeli kullanılamıyor."
            ),
        ) from error

    return ContentTranslationResponse(
        translations=translations,
    )
