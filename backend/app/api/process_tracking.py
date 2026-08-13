from __future__ import annotations

import re
import shutil
import unicodedata

from io import BytesIO
from datetime import date, datetime
from pathlib import Path
from tempfile import NamedTemporaryFile

import pandas as pd

from fastapi import (
    APIRouter,
    Depends,
    Header,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)

from fastapi.responses import StreamingResponse

from pydantic import BaseModel, Field

from sqlalchemy import select

from sqlalchemy.orm import (
    Session,
    selectinload,
)

from backend.app.database.database import get_db

from backend.app.database.models import (
    AnalysisRun,
    Notification,
    WorkItem,
    WorkItemStageHistory,
)


router = APIRouter(
    prefix="/process-tracking",
    tags=["process-tracking"],
)


STAGES = {
    "TASARIM",
    "GELISTIRME",
    "TEST",
    "TESLIM_HAZIR",
    "TAMAMLANDI",
}


# =========================================================
# RESPONSE MODELS
# =========================================================


class WorkItemResponse(BaseModel):
    id: int

    external_id: str | None

    title: str

    portal_menu: str | None
    module: str | None

    developer: str | None
    analyst: str | None

    due_date: date | None
    due_status_text: str | None

    test_given_status: str | None
    analysis_status: str | None
    test_status: str | None

    current_stage: str
    stage_override: str | None

    is_blocked: bool
    is_overdue: bool

    notes: str | None

    source_file: str | None
    source_sheet: str | None
    source_row: int | None

    analysis_run_id: int | None
    analysis_name: str | None

    high_risk_change_count: int
    critical_risk_change_count: int
    defect_candidate_count: int

    needs_review: bool

    created_at: datetime
    updated_at: datetime


class ProcessTrackingSummary(BaseModel):
    total: int
    active: int

    design: int
    development: int
    test: int
    delivery_ready: int
    completed: int

    blocked: int
    overdue: int
    needs_review: int


class ProcessImportResponse(BaseModel):
    filename: str

    imported_count: int
    updated_count: int
    skipped_count: int

    sheets: list[str]


class WorkItemAnalysisLinkRequest(BaseModel):
    analysis_run_id: int | None = None


class WorkItemStageRequest(BaseModel):
    stage: str | None = None


class WorkItemAssignmentRequest(BaseModel):
    developer: str | None = Field(
        default=None,
        max_length=200,
    )

    analyst: str | None = Field(
        default=None,
        max_length=200,
    )


class WorkItemCreateRequest(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=500,
    )

    portal_menu: str | None = Field(
        default=None,
        max_length=500,
    )

    module: str | None = Field(
        default=None,
        max_length=200,
    )

    developer: str | None = Field(
        default=None,
        max_length=200,
    )

    analyst: str | None = Field(
        default=None,
        max_length=200,
    )

    due_date: date | None = None

    current_stage: str = Field(
        default="TASARIM",
        max_length=50,
    )

    is_blocked: bool = False

    notes: str | None = None


class WorkItemUpdateRequest(WorkItemCreateRequest):
    pass


class WorkItemStageHistoryResponse(BaseModel):
    id: int
    work_item_id: int
    from_stage: str | None
    to_stage: str
    changed_by_user_id: str | None
    changed_by_name: str | None
    changed_by_role: str | None
    created_at: datetime


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    work_item_id: int | None
    is_read: bool
    created_at: datetime


# =========================================================
# COLUMN ALIASES
# =========================================================


COLUMN_ALIASES = {
    "title": {
        "surec",
        "is",
        "isadi",
        "baslik",
        "gorev",
        "task",
        "taskname",
    },

    "portal_menu": {
        "portalmenusu",
        "portalmenu",
    },

    "due": {
        "bitistarihidurum",
        "bitistarihi",
        "bitis",
        "termin",
        "termintarihi",
    },

    # developer ve analyst kasıtlı olarak
    # Excel importunda kullanılmıyor.
    #
    # Atamalar uygulama içinden kullanıcı
    # tarafından yapılacak.

    "test_given_status": {
        "testeverildimi",
        "testeverildi",
        "testedeverildi",
    },

    "analysis_status": {
        "analizoknok",
        "analizdurumu",
        "analysisstatus",
    },

    "test_status": {
        "testoknok",
        "testdurumu",
        "teststatus",
    },

    "module": {
        "modul",
        "module",
    },

    "external_id": {
        "jiraid",
        "taskid",
        "workitemid",
        "kayitid",
    },

    "notes": {
        "not",
        "notlar",
        "aciklama",
        "description",
    },
}


NEGATIVE_MARKERS = {
    "nok",
    "iptal",
    "kayityok",
    "basarisiz",
    "hata",
    "blok",
}


POSITIVE_EXACT = {
    "ok",
    "evet",
    "yes",
    "true",
    "tamam",
    "tamamlandi",
    "basarili",
}


COMPLETED_MARKERS = {
    "tamamlandi",
    "teslimedildi",
    "kapandi",
    "closed",
    "done",
}


DELIVERY_READY_MARKERS = {
    "teslimhazir",
    "teslimehazir",
    "readyfordelivery",
}


# =========================================================
# NORMALIZATION
# =========================================================


KNOWN_ACRONYMS = {
    "API",
    "DSL",
    "FTTX",
    "ID",
    "JIRA",
    "QA",
    "SMS",
    "UI",
    "UX",
    "VPN",
    "XML",
    "XLSX",
}


def _text(
    value: object,
) -> str | None:
    if value is None:
        return None

    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass

    result = str(value).strip()

    if not result:
        return None

    return result


def _collapse_spaces(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    result = re.sub(
        r"\s+",
        " ",
        value.strip(),
    )

    return result or None


def _turkish_capitalize(
    value: str,
) -> str:
    lowered = (
        value
        .replace("I", "ı")
        .replace("İ", "i")
        .lower()
    )

    if not lowered:
        return lowered

    first = lowered[0]
    first = {
        "i": "İ",
        "ı": "I",
    }.get(
        first,
        first.upper(),
    )

    return first + lowered[1:]


def _normalize_display_text(
    value: str | None,
) -> str | None:
    value = _collapse_spaces(value)

    if value is None:
        return None

    normalized_words = []

    for word in value.split(" "):
        key = re.sub(
            r"[^A-Za-z0-9ÇĞİÖŞÜçğıöşü]",
            "",
            word,
        ).upper()

        normalized_words.append(
            word.upper()
            if key in KNOWN_ACRONYMS
            else _turkish_capitalize(word)
        )

    return " ".join(normalized_words)


def _normalize_note(
    value: str | None,
) -> str | None:
    return _collapse_spaces(value)


def _ascii_key(
    value: object,
) -> str:
    text = _text(value)

    if text is None:
        return ""

    replacements = {
        "ı": "i",
        "İ": "i",
        "ş": "s",
        "Ş": "s",
        "ğ": "g",
        "Ğ": "g",
        "ü": "u",
        "Ü": "u",
        "ö": "o",
        "Ö": "o",
        "ç": "c",
        "Ç": "c",
    }

    for source, target in replacements.items():
        text = text.replace(
            source,
            target,
        )

    text = unicodedata.normalize(
        "NFKD",
        text,
    )

    text = "".join(
        character
        for character in text
        if not unicodedata.combining(
            character
        )
    )

    return re.sub(
        r"[^a-z0-9]+",
        "",
        text.lower(),
    )


def _clean_assignment(
    value: str | None,
) -> str | None:
    return _normalize_display_text(value)


def _is_team_lead_role(value: str | None) -> bool:
    key = _ascii_key(value)

    return (
        "takimlideri" in key
        or "yonetici" in key
        or "teamlead" in key
        or "manager" in key
    )


def _require_team_lead(role: str | None) -> None:
    if not _is_team_lead_role(role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Bu işlem yalnızca takım liderleri tarafından yapılabilir."
            ),
        )


def _record_stage_change(
    database: Session,
    item: WorkItem,
    from_stage: str | None,
    to_stage: str,
    *,
    user_id: str | None,
    user_name: str | None,
    user_role: str | None,
) -> None:
    if from_stage == to_stage:
        return

    database.add(
        WorkItemStageHistory(
            work_item_id=item.id,
            from_stage=from_stage,
            to_stage=to_stage,
            changed_by_user_id=_text(user_id),
            changed_by_name=_clean_assignment(user_name),
            changed_by_role=_clean_assignment(user_role),
        )
    )


def _create_notification(
    database: Session,
    *,
    recipient_name: str | None,
    title: str,
    message: str,
    work_item_id: int | None,
) -> None:
    recipient = _clean_assignment(recipient_name)
    if not recipient:
        return

    database.add(
        Notification(
            recipient_name=recipient,
            title=title,
            message=message,
            notification_type="process_tracking",
            work_item_id=work_item_id,
        )
    )


def _notify_assignees(
    database: Session,
    *,
    item: WorkItem,
    title: str,
    message: str,
    names: list[str | None],
) -> None:
    sent_to: set[str] = set()
    for name in names:
        key = _ascii_key(name)
        if not key or key in sent_to:
            continue
        sent_to.add(key)
        _create_notification(
            database,
            recipient_name=name,
            title=title,
            message=message,
            work_item_id=item.id,
        )


def _duplicate_item_exists(
    database: Session,
    *,
    title: str,
    due_date: date | None,
    exclude_id: int | None = None,
) -> bool:
    items = database.scalars(select(WorkItem)).all()

    title_key = _ascii_key(title)

    return any(
        item.id != exclude_id
        and _ascii_key(item.title) == title_key
        and item.due_date == due_date
        for item in items
    )


def _contains_marker(
    value: object,
    markers: set[str],
) -> bool:
    key = _ascii_key(value)

    if not key:
        return False

    return any(
        marker in key
        for marker in markers
    )


def _is_negative(
    value: object,
) -> bool:
    return _contains_marker(
        value,
        NEGATIVE_MARKERS,
    )


def _is_positive(
    value: object,
) -> bool:
    key = _ascii_key(value)

    if not key:
        return False

    return (
        key in POSITIVE_EXACT
        or key.startswith("ok")
    )


def _parse_due_date(
    value: object,
) -> date | None:
    if value is None:
        return None

    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass

    if isinstance(
        value,
        datetime,
    ):
        return value.date()

    if isinstance(
        value,
        date,
    ):
        return value

    text = _text(value)

    if text is None:
        return None

    try:
        parsed = pd.to_datetime(
            text,
            dayfirst=True,
            errors="coerce",
        )
    except Exception:
        return None

    if pd.isna(parsed):
        return None

    try:
        return parsed.date()
    except AttributeError:
        return None


def _resolve_columns(
    frame: pd.DataFrame,
) -> dict[str, str]:
    normalized = {
        _ascii_key(column): str(column)
        for column in frame.columns
    }

    result: dict[str, str] = {}

    for (
        field,
        aliases,
    ) in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in normalized:
                result[field] = (
                    normalized[alias]
                )
                break

    return result


def _row_value(
    row: pd.Series,
    columns: dict[str, str],
    field: str,
) -> object | None:
    column = columns.get(
        field,
    )

    if column is None:
        return None

    return row.get(
        column,
    )


# =========================================================
# AUTOMATIC STAGE ENGINE
# =========================================================


def _infer_stage(
    *,
    developer: str | None,
    due_status_text: str | None,
    test_given_status: str | None,
    analysis_status: str | None,
    test_status: str | None,
) -> str:
    if _contains_marker(
        due_status_text,
        COMPLETED_MARKERS,
    ):
        return "TAMAMLANDI"

    if _contains_marker(
        due_status_text,
        DELIVERY_READY_MARKERS,
    ):
        return "TESLIM_HAZIR"

    if _is_negative(
        analysis_status,
    ):
        return "TASARIM"

    if _is_positive(
        test_status,
    ):
        return "TESLIM_HAZIR"

    if (
        _is_positive(
            test_given_status,
        )
        or _text(test_status)
        is not None
    ):
        return "TEST"

    if (
        _is_positive(
            analysis_status,
        )
        or developer
    ):
        return "GELISTIRME"

    return "TASARIM"


def _calculate_blocked(
    *,
    due_status_text: str | None,
    analysis_status: str | None,
    test_status: str | None,
) -> bool:
    return (
        _is_negative(
            due_status_text,
        )
        or _is_negative(
            analysis_status,
        )
        or _is_negative(
            test_status,
        )
    )


def _refresh_automatic_stage(
    item: WorkItem,
) -> None:
    item.is_blocked = (
        _calculate_blocked(
            due_status_text=(
                item.due_status_text
            ),
            analysis_status=(
                item.analysis_status
            ),
            test_status=(
                item.test_status
            ),
        )
    )

    if (
        item.stage_override
        is not None
    ):
        item.current_stage = (
            item.stage_override
        )
        return

    item.current_stage = (
        _infer_stage(
            developer=item.developer,
            due_status_text=(
                item.due_status_text
            ),
            test_given_status=(
                item.test_given_status
            ),
            analysis_status=(
                item.analysis_status
            ),
            test_status=(
                item.test_status
            ),
        )
    )


# =========================================================
# RESPONSE HELPERS
# =========================================================


def _is_overdue(
    item: WorkItem,
) -> bool:
    if item.due_date is None:
        return False

    if item.current_stage in {
        "TESLIM_HAZIR",
        "TAMAMLANDI",
    }:
        return False

    return (
        item.due_date
        < date.today()
    )


def _analysis_counts(
    item: WorkItem,
) -> tuple[
    int,
    int,
    int,
]:
    analysis = (
        item.analysis_run
    )

    if analysis is None:
        return (
            0,
            0,
            0,
        )

    high_count = 0
    critical_count = 0

    for change in (
        analysis.requirement_changes
        or []
    ):
        risk = (
            change.risk_level
            or ""
        ).strip().lower()

        if risk == "high":
            high_count += 1

        elif risk == "critical":
            critical_count += 1

    defect_count = len(
        analysis.defect_rankings
        or []
    )

    return (
        high_count,
        critical_count,
        defect_count,
    )


def _serialize_item(
    item: WorkItem,
) -> WorkItemResponse:
    (
        high_count,
        critical_count,
        defect_count,
    ) = _analysis_counts(
        item,
    )

    needs_review = (
        high_count > 0
        or critical_count > 0
        or defect_count > 0
    )

    return WorkItemResponse(
        id=item.id,

        external_id=(
            item.external_id
        ),

        title=(
            _normalize_display_text(item.title)
            or item.title
        ),

        portal_menu=(
            _normalize_display_text(
                item.portal_menu,
            )
        ),

        module=_normalize_display_text(
            item.module,
        ),

        developer=_normalize_display_text(
            item.developer,
        ),
        analyst=_normalize_display_text(
            item.analyst,
        ),

        due_date=item.due_date,

        due_status_text=(
            item.due_status_text
        ),

        test_given_status=(
            item.test_given_status
        ),

        analysis_status=(
            item.analysis_status
        ),

        test_status=(
            item.test_status
        ),

        current_stage=(
            item.current_stage
        ),

        stage_override=(
            item.stage_override
        ),

        is_blocked=(
            item.is_blocked
        ),

        is_overdue=(
            _is_overdue(
                item,
            )
        ),

        notes=_normalize_note(item.notes),

        source_file=(
            item.source_file
        ),

        source_sheet=(
            item.source_sheet
        ),

        source_row=(
            item.source_row
        ),

        analysis_run_id=(
            item.analysis_run_id
        ),

        analysis_name=(
            item.analysis_run
            .analysis_name
            if item.analysis_run
            is not None
            else None
        ),

        high_risk_change_count=(
            high_count
        ),

        critical_risk_change_count=(
            critical_count
        ),

        defect_candidate_count=(
            defect_count
        ),

        needs_review=(
            needs_review
        ),

        created_at=(
            item.created_at
        ),

        updated_at=(
            item.updated_at
        ),
    )


def _work_item_query():
    return (
        select(
            WorkItem,
        )
        .options(
            selectinload(
                WorkItem.analysis_run,
            ).selectinload(
                AnalysisRun.requirement_changes,
            ),

            selectinload(
                WorkItem.analysis_run,
            ).selectinload(
                AnalysisRun.defect_rankings,
            ),
        )
    )


def _get_item(
    database: Session,
    item_id: int,
) -> WorkItem:
    item = database.scalar(
        _work_item_query()
        .where(
            WorkItem.id
            == item_id
        )
    )

    if item is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "Süreç kaydı bulunamadı."
            ),
        )

    return item


# =========================================================
# GET ITEMS
# =========================================================


@router.post(
    "/items",
    response_model=WorkItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_item(
    request: WorkItemCreateRequest,
    x_user_role: str | None = Header(default=None, alias="X-User-Role"),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_name: str | None = Header(default=None, alias="X-User-Name"),
    database: Session = Depends(
        get_db,
    ),
):
    _require_team_lead(x_user_role)

    normalized_title = (
        _normalize_display_text(request.title)
        or request.title.strip()
    )

    if _duplicate_item_exists(
        database,
        title=normalized_title,
        due_date=request.due_date,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Aynı süreç/iş adı ve tarihle kayıt zaten mevcut."
            ),
        )

    normalized_stage = (
        request.current_stage
        .strip()
        .upper()
    )

    if normalized_stage not in STAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz süreç aşaması.",
        )

    item = WorkItem(
        title=normalized_title,
        portal_menu=_clean_assignment(
            request.portal_menu,
        ),
        module=_clean_assignment(
            request.module,
        ),
        developer=_clean_assignment(
            request.developer,
        ),
        analyst=_clean_assignment(
            request.analyst,
        ),
        due_date=request.due_date,
        current_stage=normalized_stage,
        stage_override=normalized_stage,
        is_blocked=request.is_blocked,
        notes=_normalize_note(
            request.notes,
        ),
    )

    database.add(item)
    database.commit()

    _record_stage_change(
        database,
        item,
        None,
        normalized_stage,
        user_id=x_user_id,
        user_name=x_user_name,
        user_role=x_user_role,
    )

    _notify_assignees(
        database,
        item=item,
        title="Yeni süreç kaydı",
        message=f"{item.title} kaydına atandınız.",
        names=[item.developer, item.analyst],
    )
    database.commit()

    return _serialize_item(
        _get_item(
            database,
            item.id,
        ),
    )


@router.put(
    "/items/{item_id}",
    response_model=WorkItemResponse,
)
def update_item(
    item_id: int,
    request: WorkItemUpdateRequest,
    x_user_role: str | None = Header(default=None, alias="X-User-Role"),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_name: str | None = Header(default=None, alias="X-User-Name"),
    database: Session = Depends(get_db),
):
    _require_team_lead(x_user_role)
    item = _get_item(database, item_id)

    normalized_title = (
        _normalize_display_text(request.title)
        or request.title.strip()
    )

    if _duplicate_item_exists(
        database,
        title=normalized_title,
        due_date=request.due_date,
        exclude_id=item_id,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Aynı süreç/iş adı ve tarihle kayıt zaten mevcut."
            ),
        )

    normalized_stage = request.current_stage.strip().upper()
    if normalized_stage not in STAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz süreç aşaması.",
        )

    previous_stage = item.current_stage
    previous_developer = item.developer
    previous_analyst = item.analyst
    item.title = normalized_title
    item.portal_menu = _clean_assignment(request.portal_menu)
    item.module = _clean_assignment(request.module)
    item.developer = _clean_assignment(request.developer)
    item.analyst = _clean_assignment(request.analyst)
    item.due_date = request.due_date
    item.current_stage = normalized_stage
    item.stage_override = normalized_stage
    item.is_blocked = request.is_blocked
    item.notes = _normalize_note(request.notes)

    database.flush()
    _record_stage_change(
        database,
        item,
        previous_stage,
        normalized_stage,
        user_id=x_user_id,
        user_name=x_user_name,
        user_role=x_user_role,
    )

    changed_assignees = [
        item.developer if _ascii_key(item.developer) != _ascii_key(previous_developer) else None,
        item.analyst if _ascii_key(item.analyst) != _ascii_key(previous_analyst) else None,
    ]
    _notify_assignees(
        database,
        item=item,
        title="Süreç atamanız güncellendi",
        message=f"{item.title} kaydındaki atamanız güncellendi.",
        names=changed_assignees,
    )
    if previous_stage != normalized_stage:
        _notify_assignees(
            database,
            item=item,
            title="Süreç aşaması değişti",
            message=f"{item.title} aşaması güncellendi: {normalized_stage}.",
            names=[item.developer, item.analyst],
        )
    database.commit()

    return _serialize_item(_get_item(database, item_id))


@router.get(
    "/export-excel",
)
def export_excel(
    search: str | None = Query(default=None),
    stage: str | None = Query(default=None),
    database: Session = Depends(
        get_db,
    ),
):
    items = (
        database.scalars(
            _work_item_query()
            .order_by(
                WorkItem.id.desc(),
            )
        )
        .unique()
        .all()
    )

    search_key = _ascii_key(search)
    normalized_stage = stage.strip().upper() if stage else None

    if normalized_stage and normalized_stage not in STAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz süreç aşaması.",
        )

    if search_key or normalized_stage:
        items = [
            item
            for item in items
            if (
                not normalized_stage
                or item.current_stage == normalized_stage
            )
            and (
                not search_key
                or search_key in _ascii_key(
                    " ".join(
                        value
                        for value in (
                            item.title,
                            item.portal_menu,
                            item.module,
                            item.developer,
                            item.analyst,
                            item.notes,
                        )
                        if value
                    )
                )
            )
        ]

    rows = [
        {
            "ID": item.id,
            "Süreç / İş": _normalize_display_text(item.title),
            "Menü": _normalize_display_text(item.portal_menu),
            "Modül": _normalize_display_text(item.module),
            "Yazılımcı": _normalize_display_text(item.developer),
            "Analist": _normalize_display_text(item.analyst),
            "Aşama": item.current_stage,
            "Tarih": item.due_date,
            "Blokeli": "Evet" if item.is_blocked else "Hayır",
            "Notlar": _normalize_note(item.notes),
            "Oluşturulma": item.created_at,
        }
        for item in items
    ]

    frame = pd.DataFrame(rows)
    workbook = BytesIO()

    with pd.ExcelWriter(
        workbook,
        engine="openpyxl",
    ) as writer:
        frame.to_excel(
            writer,
            index=False,
            sheet_name="Süreç Takibi",
        )

        summary_rows = [
            {"Metrik": "Toplam kayıt", "Değer": len(items)},
            {
                "Metrik": "Aktif kayıt",
                "Değer": sum(item.current_stage != "TAMAMLANDI" for item in items),
            },
            {
                "Metrik": "Blokeli kayıt",
                "Değer": sum(item.is_blocked for item in items),
            },
            {
                "Metrik": "Geciken kayıt",
                "Değer": sum(_is_overdue(item) for item in items),
            },
        ]
        for stage_name in sorted(STAGES):
            summary_rows.append({
                "Metrik": f"Aşama: {stage_name}",
                "Değer": sum(item.current_stage == stage_name for item in items),
            })

        pd.DataFrame(summary_rows).to_excel(
            writer,
            index=False,
            sheet_name="Özet",
        )

        date_stage_rows = [
            {
                "Tarih": item.due_date,
                "Aşama": item.current_stage,
                "Kayıt sayısı": 1,
            }
            for item in items
        ]
        date_stage_frame = pd.DataFrame(date_stage_rows)
        if not date_stage_frame.empty:
            date_stage_frame = (
                date_stage_frame
                .groupby(["Tarih", "Aşama"], dropna=False, as_index=False)
                ["Kayıt sayısı"]
                .sum()
                .sort_values(["Tarih", "Aşama"], na_position="last")
            )
        date_stage_frame.to_excel(
            writer,
            index=False,
            sheet_name="Tarih-Aşama Özeti",
        )

        worksheet = writer.book["Süreç Takibi"]
        worksheet.freeze_panes = "A2"
        worksheet.auto_filter.ref = worksheet.dimensions

        for column in worksheet.columns:
            width = max(
                len(str(cell.value or ""))
                for cell in column
            )
            worksheet.column_dimensions[
                column[0].column_letter
            ].width = min(
                max(width + 2, 12),
                36,
            )

        for sheet_name in ("Özet", "Tarih-Aşama Özeti"):
            worksheet = writer.book[sheet_name]
            worksheet.freeze_panes = "A2"
            worksheet.auto_filter.ref = worksheet.dimensions
            for column in worksheet.columns:
                width = max(
                    len(str(cell.value or ""))
                    for cell in column
                )
                worksheet.column_dimensions[
                    column[0].column_letter
                ].width = min(max(width + 2, 12), 36)

    workbook.seek(0)

    return StreamingResponse(
        workbook,
        media_type=(
            "application/vnd.openxmlformats-"
            "officedocument.spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition": (
                "attachment; filename=process-tracking.xlsx"
            ),
        },
    )


@router.get(
    "/items",
    response_model=list[
        WorkItemResponse
    ],
)
def get_items(
    database: Session = Depends(
        get_db,
    ),
):
    items = (
        database.scalars(
            _work_item_query()
            .order_by(
                WorkItem.id.desc(),
            )
        )
        .unique()
        .all()
    )

    return [
        _serialize_item(
            item,
        )
        for item in items
    ]


# =========================================================
# GET ITEM DETAIL
# =========================================================


@router.get(
    "/items/{item_id}",
    response_model=WorkItemResponse,
)
def get_item(
    item_id: int,
    database: Session = Depends(
        get_db,
    ),
):
    item = _get_item(
        database,
        item_id,
    )

    return _serialize_item(
        item,
    )


@router.get(
    "/items/{item_id}/history",
    response_model=list[WorkItemStageHistoryResponse],
)
def get_item_history(
    item_id: int,
    database: Session = Depends(get_db),
):
    _get_item(database, item_id)

    history = database.scalars(
        select(WorkItemStageHistory)
        .where(WorkItemStageHistory.work_item_id == item_id)
        .order_by(WorkItemStageHistory.created_at.desc())
    ).all()

    return [
        WorkItemStageHistoryResponse(
            id=entry.id,
            work_item_id=entry.work_item_id,
            from_stage=entry.from_stage,
            to_stage=entry.to_stage,
            changed_by_user_id=entry.changed_by_user_id,
            changed_by_name=entry.changed_by_name,
            changed_by_role=entry.changed_by_role,
            created_at=entry.created_at,
        )
        for entry in history
    ]


@router.get(
    "/notifications",
    response_model=list[NotificationResponse],
)
def get_notifications(
    x_user_name: str | None = Header(default=None, alias="X-User-Name"),
    unread_only: bool = Query(default=False),
    database: Session = Depends(get_db),
):
    user_key = _ascii_key(x_user_name)
    if not user_key:
        return []

    notifications = database.scalars(
        select(Notification)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .limit(100)
    ).all()

    return [
        NotificationResponse(
            id=notification.id,
            title=notification.title,
            message=notification.message,
            notification_type=notification.notification_type,
            work_item_id=notification.work_item_id,
            is_read=notification.is_read,
            created_at=notification.created_at,
        )
        for notification in notifications
        if _ascii_key(notification.recipient_name) == user_key
        and (not unread_only or not notification.is_read)
    ]


@router.patch(
    "/notifications/{notification_id}/read",
    response_model=NotificationResponse,
)
def mark_notification_read(
    notification_id: int,
    x_user_name: str | None = Header(default=None, alias="X-User-Name"),
    database: Session = Depends(get_db),
):
    notification = database.get(Notification, notification_id)
    if notification is None or _ascii_key(notification.recipient_name) != _ascii_key(x_user_name):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bildirim bulunamadı.",
        )

    notification.is_read = True
    database.commit()

    return NotificationResponse(
        id=notification.id,
        title=notification.title,
        message=notification.message,
        notification_type=notification.notification_type,
        work_item_id=notification.work_item_id,
        is_read=notification.is_read,
        created_at=notification.created_at,
    )


# =========================================================
# SUMMARY
# =========================================================


@router.get(
    "/summary",
    response_model=(
        ProcessTrackingSummary
    ),
)
def get_summary(
    database: Session = Depends(
        get_db,
    ),
):
    items = (
        database.scalars(
            _work_item_query()
        )
        .unique()
        .all()
    )

    total = len(
        items,
    )

    design = sum(
        1
        for item in items
        if item.current_stage
        == "TASARIM"
    )

    development = sum(
        1
        for item in items
        if item.current_stage
        == "GELISTIRME"
    )

    test_count = sum(
        1
        for item in items
        if item.current_stage
        == "TEST"
    )

    delivery_ready = sum(
        1
        for item in items
        if item.current_stage
        == "TESLIM_HAZIR"
    )

    completed = sum(
        1
        for item in items
        if item.current_stage
        == "TAMAMLANDI"
    )

    blocked = sum(
        1
        for item in items
        if item.is_blocked
    )

    overdue = sum(
        1
        for item in items
        if _is_overdue(
            item,
        )
    )

    needs_review = sum(
        1
        for item in items
        if _serialize_item(
            item,
        ).needs_review
    )

    active = (
        total
        - completed
    )

    return (
        ProcessTrackingSummary(
            total=total,
            active=active,

            design=design,

            development=(
                development
            ),

            test=test_count,

            delivery_ready=(
                delivery_ready
            ),

            completed=completed,

            blocked=blocked,

            overdue=overdue,

            needs_review=(
                needs_review
            ),
        )
    )


# =========================================================
# EXCEL IMPORT
# =========================================================


@router.post(
    "/import-excel",
    response_model=(
        ProcessImportResponse
    ),
)
def import_excel(
    file: UploadFile = File(...),

    database: Session = Depends(
        get_db,
    ),
):
    filename = (
        file.filename
        or "process_tracking.xlsx"
    )

    suffix = (
        Path(filename)
        .suffix
        .lower()
    )

    if suffix != ".xlsx":
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Sadece .xlsx dosyaları "
                "destekleniyor."
            ),
        )

    temporary_path: Path | None = None

    imported_count = 0
    updated_count = 0
    skipped_count = 0

    processed_sheets: list[str] = []

    try:
        with NamedTemporaryFile(
            delete=False,
            suffix=".xlsx",
        ) as temporary_file:
            shutil.copyfileobj(
                file.file,
                temporary_file,
            )

            temporary_path = Path(
                temporary_file.name
            )

        workbook = pd.read_excel(
            temporary_path,
            sheet_name=None,
        )

        for (
            sheet_name,
            frame,
        ) in workbook.items():
            if frame.empty:
                continue

            columns = (
                _resolve_columns(
                    frame,
                )
            )

            if (
                "title"
                not in columns
            ):
                continue

            processed_sheets.append(
                str(sheet_name)
            )

            for (
                row_index,
                row,
            ) in frame.iterrows():
                title = _text(
                    _row_value(
                        row,
                        columns,
                        "title",
                    )
                )

                if title is None:
                    skipped_count += 1
                    continue

                title = (
                    _normalize_display_text(title)
                    or title
                )

                source_row = (
                    int(row_index)
                    + 2
                )

                portal_menu = _text(
                    _row_value(
                        row,
                        columns,
                        "portal_menu",
                    )
                )

                module = _text(
                    _row_value(
                        row,
                        columns,
                        "module",
                    )
                )

                portal_menu = _normalize_display_text(
                    portal_menu,
                )
                module = _normalize_display_text(
                    module,
                )

                external_id = _text(
                    _row_value(
                        row,
                        columns,
                        "external_id",
                    )
                )

                notes = _text(
                    _row_value(
                        row,
                        columns,
                        "notes",
                    )
                )

                notes = _normalize_note(notes)

                test_given_status = _text(
                    _row_value(
                        row,
                        columns,
                        "test_given_status",
                    )
                )

                analysis_status = _text(
                    _row_value(
                        row,
                        columns,
                        "analysis_status",
                    )
                )

                test_status = _text(
                    _row_value(
                        row,
                        columns,
                        "test_status",
                    )
                )

                due_raw = _row_value(
                    row,
                    columns,
                    "due",
                )

                due_date = (
                    _parse_due_date(
                        due_raw,
                    )
                )

                due_status_text = (
                    None
                    if due_date
                    is not None
                    else _text(
                        due_raw,
                    )
                )

                existing = (
                    database.scalar(
                        select(
                            WorkItem,
                        )
                        .where(
                            WorkItem.source_file
                            == filename,

                            WorkItem.source_sheet
                            == str(
                                sheet_name
                            ),

                            WorkItem.source_row
                            == source_row,
                        )
                    )
                )

                if existing is None:
                    item = WorkItem(
                        external_id=(
                            external_id
                        ),

                        title=title,

                        portal_menu=(
                            portal_menu
                        ),

                        module=module,

                        # Kullanıcı ataması.
                        # Excel'den isim alınmaz.
                        developer=None,
                        analyst=None,

                        due_date=(
                            due_date
                        ),

                        due_status_text=(
                            due_status_text
                        ),

                        test_given_status=(
                            test_given_status
                        ),

                        analysis_status=(
                            analysis_status
                        ),

                        test_status=(
                            test_status
                        ),

                        current_stage=(
                            "TASARIM"
                        ),

                        stage_override=None,

                        is_blocked=False,

                        source_file=(
                            filename
                        ),

                        source_sheet=str(
                            sheet_name
                        ),

                        source_row=(
                            source_row
                        ),

                        notes=notes,
                    )

                    _refresh_automatic_stage(
                        item,
                    )

                    database.add(
                        item,
                    )

                    imported_count += 1

                else:
                    # Excel tekrar yüklendiğinde
                    # developer / analyst alanlarına
                    # dokunmuyoruz.
                    #
                    # Böylece uygulamada yapılan
                    # kullanıcı atamaları korunur.

                    existing.external_id = (
                        external_id
                    )

                    existing.title = title

                    existing.portal_menu = (
                        portal_menu
                    )

                    existing.module = module

                    existing.due_date = (
                        due_date
                    )

                    existing.due_status_text = (
                        due_status_text
                    )

                    existing.test_given_status = (
                        test_given_status
                    )

                    existing.analysis_status = (
                        analysis_status
                    )

                    existing.test_status = (
                        test_status
                    )

                    existing.notes = notes

                    _refresh_automatic_stage(
                        existing,
                    )

                    updated_count += 1

        if not processed_sheets:
            raise HTTPException(
                status_code=(
                    status.HTTP_400_BAD_REQUEST
                ),
                detail=(
                    "Excel içinde "
                    "'Süreç' / 'İş' / "
                    "'Başlık' kolonlarından "
                    "biri bulunamadı."
                ),
            )

        database.commit()

        return ProcessImportResponse(
            filename=filename,

            imported_count=(
                imported_count
            ),

            updated_count=(
                updated_count
            ),

            skipped_count=(
                skipped_count
            ),

            sheets=(
                processed_sheets
            ),
        )

    except HTTPException:
        database.rollback()
        raise

    except Exception as error:
        database.rollback()

        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Excel dosyası işlenemedi: "
                f"{error}"
            ),
        ) from error

    finally:
        if (
            temporary_path
            is not None
            and temporary_path.exists()
        ):
            temporary_path.unlink(
                missing_ok=True,
            )


# =========================================================
# USER ASSIGNMENT
# =========================================================


@router.patch(
    "/items/{item_id}/assignment",
    response_model=WorkItemResponse,
)
def update_assignment(
    item_id: int,

    request: WorkItemAssignmentRequest,

    x_user_role: str | None = Header(default=None, alias="X-User-Role"),

    database: Session = Depends(
        get_db,
    ),
):
    _require_team_lead(x_user_role)
    item = _get_item(
        database,
        item_id,
    )

    previous_developer = item.developer
    previous_analyst = item.analyst

    item.developer = (
        _clean_assignment(
            request.developer,
        )
    )

    item.analyst = (
        _clean_assignment(
            request.analyst,
        )
    )

    _refresh_automatic_stage(
        item,
    )

    _notify_assignees(
        database,
        item=item,
        title="Süreç atamanız güncellendi",
        message=f"{item.title} kaydındaki atamanız güncellendi.",
        names=[
            item.developer if _ascii_key(item.developer) != _ascii_key(previous_developer) else None,
            item.analyst if _ascii_key(item.analyst) != _ascii_key(previous_analyst) else None,
        ],
    )

    database.commit()

    item = _get_item(
        database,
        item_id,
    )

    return _serialize_item(
        item,
    )


# =========================================================
# ANALYSIS LINK
# =========================================================


@router.patch(
    "/items/{item_id}/analysis",
    response_model=WorkItemResponse,
)
def update_analysis_link(
    item_id: int,

    request: WorkItemAnalysisLinkRequest,

    database: Session = Depends(
        get_db,
    ),
):
    item = _get_item(
        database,
        item_id,
    )

    if (
        request.analysis_run_id
        is not None
    ):
        analysis = database.get(
            AnalysisRun,
            request.analysis_run_id,
        )

        if analysis is None:
            raise HTTPException(
                status_code=(
                    status.HTTP_404_NOT_FOUND
                ),
                detail=(
                    "Analiz bulunamadı."
                ),
            )

    item.analysis_run_id = (
        request.analysis_run_id
    )

    database.commit()

    item = _get_item(
        database,
        item_id,
    )

    return _serialize_item(
        item,
    )


# =========================================================
# STAGE OVERRIDE
# =========================================================


@router.patch(
    "/items/{item_id}/stage",
    response_model=WorkItemResponse,
)
def update_stage(
    item_id: int,

    request: WorkItemStageRequest,

    x_user_role: str | None = Header(default=None, alias="X-User-Role"),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_name: str | None = Header(default=None, alias="X-User-Name"),

    database: Session = Depends(
        get_db,
    ),
):
    _require_team_lead(x_user_role)
    item = _get_item(
        database,
        item_id,
    )

    previous_stage = item.current_stage

    if request.stage is None:
        item.stage_override = None

        _refresh_automatic_stage(
            item,
        )

    else:
        normalized = (
            request.stage
            .strip()
            .upper()
        )

        if normalized not in STAGES:
            raise HTTPException(
                status_code=(
                    status.HTTP_400_BAD_REQUEST
                ),
                detail=(
                    "Geçersiz süreç aşaması."
                ),
            )

        item.stage_override = (
            normalized
        )

        item.current_stage = (
            normalized
        )

    _record_stage_change(
        database,
        item,
        previous_stage,
        item.current_stage,
        user_id=x_user_id,
        user_name=x_user_name,
        user_role=x_user_role,
    )

    database.commit()

    item = _get_item(
        database,
        item_id,
    )

    return _serialize_item(
        item,
    )


# =========================================================
# DELETE
# =========================================================


@router.delete(
    "/items/{item_id}",
    status_code=(
        status.HTTP_204_NO_CONTENT
    ),
)
def delete_item(
    item_id: int,

    x_user_role: str | None = Header(default=None, alias="X-User-Role"),

    database: Session = Depends(
        get_db,
    ),
):
    _require_team_lead(x_user_role)
    item = database.get(
        WorkItem,
        item_id,
    )

    if item is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "Süreç kaydı bulunamadı."
            ),
        )

    database.delete(
        item,
    )

    database.commit()

    return None
