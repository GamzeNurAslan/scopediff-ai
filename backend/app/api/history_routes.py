from __future__ import annotations

from pathlib import Path

import pandas as pd
from fastapi import (
    APIRouter,
    HTTPException,
    status,
)
from pydantic import BaseModel

from backend.app.history.requirement_version_history import (
    RequirementVersionHistory,
)


router = APIRouter(
    prefix="/history",
    tags=["History"],
)


PROJECT_ROOT = (
    Path(__file__)
    .resolve()
    .parents[3]
)


HISTORY_FILE_PATH = (
    PROJECT_ROOT
    / "dataset"
    / "requirement_version_history_v1.xlsx"
)


HISTORY_SHEET_NAME = (
    "Version History"
)




class HistoryCatalogItem(
    BaseModel
):
    requirement_id: str
    module: str

    version_count: int

    first_version: str
    latest_version: str

    highest_risk: str | None

    current_text: str


class HistoryCatalogResponse(
    BaseModel
):
    modules: list[str]

    requirements: list[
        HistoryCatalogItem
    ]


class HistorySummaryResponse(
    BaseModel
):
    requirement_id: str
    module: str

    first_version: str
    latest_version: str

    version_count: int
    transition_count: int

    highest_risk: str | None

    change_types: list[str]

    current_text: str


class HistoryTimelineItem(
    BaseModel
):
    requirement_id: str
    module: str

    version: str
    version_label: str

    requirement_text: str

    previous_version: str | None
    transition_id: str | None

    change_type: str
    risk_level: str

    change_explanation: str

    is_initial_version: bool
    is_current_version: bool


class RequirementHistoryResponse(
    BaseModel
):
    summary: HistorySummaryResponse

    timeline: list[
        HistoryTimelineItem
    ]




def _load_history_dataframe(
) -> pd.DataFrame:

    if not HISTORY_FILE_PATH.exists():
        raise HTTPException(
            status_code=(
                status
                .HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Version history veri "
                "dosyası bulunamadı: "
                f"{HISTORY_FILE_PATH}"
            ),
        )

    try:
        dataframe = pd.read_excel(
            HISTORY_FILE_PATH,
            sheet_name=(
                HISTORY_SHEET_NAME
            ),
            engine="openpyxl",
        )

    except Exception as error:
        raise HTTPException(
            status_code=(
                status
                .HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Version history Excel "
                "dosyası okunamadı: "
                f"{error}"
            ),
        ) from error

    dataframe.columns = [
        str(column).strip()
        for column
        in dataframe.columns
    ]

    return dataframe


def _safe_string(
    value: object,
) -> str:

    if value is None:
        return ""

    try:
        if pd.isna(value):
            return ""
    except (
        TypeError,
        ValueError,
    ):
        pass

    return str(
        value
    ).strip()


def _safe_optional_string(
    value: object,
) -> str | None:

    text = _safe_string(
        value
    )

    if not text:
        return None

    return text




@router.get(
    "/requirements",
    response_model=(
        HistoryCatalogResponse
    ),
)
def get_history_catalog(
) -> HistoryCatalogResponse:

    dataframe = (
        _load_history_dataframe()
    )

    history_service = (
        RequirementVersionHistory()
    )

    requirement_ids = sorted(
        {
            str(value).strip()
            for value
            in dataframe[
                "requirement_id"
            ].dropna()
            if str(value).strip()
        }
    )

    requirements: list[
        HistoryCatalogItem
    ] = []

    modules: set[str] = set()

    for requirement_id in requirement_ids:

        try:
            summary = (
                history_service
                .get_summary(
                    dataframe=(
                        dataframe
                    ),
                    requirement_id=(
                        requirement_id
                    ),
                )
            )

        except ValueError:
            continue

        module = (
            _safe_string(
                summary[
                    "module"
                ]
            )
        )

        if module:
            modules.add(
                module
            )

        requirements.append(
            HistoryCatalogItem(
                requirement_id=(
                    requirement_id
                ),

                module=(
                    module
                ),

                version_count=int(
                    summary[
                        "version_count"
                    ]
                ),

                first_version=(
                    _safe_string(
                        summary[
                            "first_version"
                        ]
                    )
                ),

                latest_version=(
                    _safe_string(
                        summary[
                            "latest_version"
                        ]
                    )
                ),

                highest_risk=(
                    _safe_optional_string(
                        summary[
                            "highest_risk"
                        ]
                    )
                ),

                current_text=(
                    _safe_string(
                        summary[
                            "current_text"
                        ]
                    )
                ),
            )
        )

    requirements.sort(
        key=lambda item: (
            item.module,
            item.requirement_id,
        )
    )

    return HistoryCatalogResponse(
        modules=sorted(
            modules
        ),
        requirements=(
            requirements
        ),
    )




@router.get(
    "/requirements/{requirement_id}",
    response_model=(
        RequirementHistoryResponse
    ),
)
def get_requirement_history(
    requirement_id: str,
) -> RequirementHistoryResponse:

    dataframe = (
        _load_history_dataframe()
    )

    history_service = (
        RequirementVersionHistory()
    )

    try:
        summary = (
            history_service
            .get_summary(
                dataframe=(
                    dataframe
                ),
                requirement_id=(
                    requirement_id
                ),
            )
        )

        timeline_dataframe = (
            history_service
            .build_timeline(
                dataframe=(
                    dataframe
                ),
                requirement_id=(
                    requirement_id
                ),
            )
        )

    except ValueError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=str(
                error
            ),
        ) from error

    timeline: list[
        HistoryTimelineItem
    ] = []

    for (
        _,
        row,
    ) in timeline_dataframe.iterrows():

        timeline.append(
            HistoryTimelineItem(
                requirement_id=(
                    _safe_string(
                        row[
                            "requirement_id"
                        ]
                    )
                ),

                module=(
                    _safe_string(
                        row[
                            "module"
                        ]
                    )
                ),

                version=(
                    _safe_string(
                        row[
                            "version"
                        ]
                    )
                ),

                version_label=(
                    _safe_string(
                        row[
                            "version_label"
                        ]
                    )
                ),

                requirement_text=(
                    _safe_string(
                        row[
                            "requirement_text"
                        ]
                    )
                ),

                previous_version=(
                    _safe_optional_string(
                        row[
                            "previous_version"
                        ]
                    )
                ),

                transition_id=(
                    _safe_optional_string(
                        row[
                            "transition_id"
                        ]
                    )
                ),

                change_type=(
                    _safe_string(
                        row[
                            "change_type"
                        ]
                    )
                ),

                risk_level=(
                    _safe_string(
                        row[
                            "risk_level"
                        ]
                    )
                ),

                change_explanation=(
                    _safe_string(
                        row[
                            "change_explanation"
                        ]
                    )
                ),

                is_initial_version=(
                    bool(
                        row[
                            "is_initial_version"
                        ]
                    )
                ),

                is_current_version=(
                    bool(
                        row[
                            "is_current_version"
                        ]
                    )
                ),
            )
        )

    return RequirementHistoryResponse(
        summary=(
            HistorySummaryResponse(
                requirement_id=(
                    _safe_string(
                        summary[
                            "requirement_id"
                        ]
                    )
                ),

                module=(
                    _safe_string(
                        summary[
                            "module"
                        ]
                    )
                ),

                first_version=(
                    _safe_string(
                        summary[
                            "first_version"
                        ]
                    )
                ),

                latest_version=(
                    _safe_string(
                        summary[
                            "latest_version"
                        ]
                    )
                ),

                version_count=int(
                    summary[
                        "version_count"
                    ]
                ),

                transition_count=int(
                    summary[
                        "transition_count"
                    ]
                ),

                highest_risk=(
                    _safe_optional_string(
                        summary[
                            "highest_risk"
                        ]
                    )
                ),

                change_types=[
                    str(item)
                    for item
                    in summary[
                        "change_types"
                    ]
                ],

                current_text=(
                    _safe_string(
                        summary[
                            "current_text"
                        ]
                    )
                ),
            )
        ),

        timeline=(
            timeline
        ),
    )