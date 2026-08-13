from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    JSON,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from backend.app.database.database import Base


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    analysis_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    source_version: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    target_version: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )


    created_by_user_id: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    created_by_name: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    created_by_email: Mapped[str | None] = mapped_column(
        String(320),
        nullable=True,
    )

    created_by_department: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    created_by_role: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    requirement_changes: Mapped[
        list["RequirementChange"]
    ] = relationship(
        back_populates="analysis_run",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    defect_rankings: Mapped[
        list["DefectRanking"]
    ] = relationship(
        back_populates="analysis_run",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    work_items: Mapped[
        list["WorkItem"]
    ] = relationship(
        back_populates="analysis_run",
        passive_deletes=True,
    )


class RequirementChange(Base):
    __tablename__ = "requirement_changes"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    analysis_run_id: Mapped[int] = mapped_column(
        ForeignKey(
            "analysis_runs.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    old_requirement_id: Mapped[
        str | None
    ] = mapped_column(
        String(100),
        nullable=True,
    )

    new_requirement_id: Mapped[
        str | None
    ] = mapped_column(
        String(100),
        nullable=True,
    )

    old_requirement_text: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    new_requirement_text: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    detailed_change_types: Mapped[
        list[str]
    ] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    change_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    risk_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    risk_level: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    confidence: Mapped[
        float | None
    ] = mapped_column(
        Float,
        nullable=True,
    )

    explanation: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    analysis_run: Mapped[
        AnalysisRun
    ] = relationship(
        back_populates="requirement_changes"
    )


class DefectRanking(Base):
    __tablename__ = "defect_rankings"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    analysis_run_id: Mapped[int] = mapped_column(
        ForeignKey(
            "analysis_runs.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    defect_id: Mapped[
        str | None
    ] = mapped_column(
        String(100),
        nullable=True,
    )

    defect_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    change_id: Mapped[
        str | None
    ] = mapped_column(
        String(100),
        nullable=True,
    )

    relevance_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    rank_position: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    reason: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    analysis_run: Mapped[
        AnalysisRun
    ] = relationship(
        back_populates="defect_rankings"
    )


class WorkItem(Base):
    __tablename__ = "work_items"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    analysis_run_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "analysis_runs.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    external_id: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    portal_menu: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    module: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    developer: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    analyst: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    due_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    due_status_text: Mapped[str | None] = mapped_column(
        String(300),
        nullable=True,
    )

    test_given_status: Mapped[str | None] = mapped_column(
        String(300),
        nullable=True,
    )

    analysis_status: Mapped[str | None] = mapped_column(
        String(300),
        nullable=True,
    )

    test_status: Mapped[str | None] = mapped_column(
        String(300),
        nullable=True,
    )

    current_stage: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="TASARIM",
    )

    stage_override: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    is_blocked: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    source_file: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    source_sheet: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    source_row: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    analysis_run: Mapped[
        AnalysisRun | None
    ] = relationship(
        back_populates="work_items",
    )

    stage_history: Mapped[list["WorkItemStageHistory"]] = relationship(
        back_populates="work_item",
        cascade="all, delete-orphan",
        order_by="WorkItemStageHistory.created_at.desc()",
    )


class WorkItemStageHistory(Base):
    __tablename__ = "work_item_stage_history"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    work_item_id: Mapped[int] = mapped_column(
        ForeignKey(
            "work_items.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    from_stage: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    to_stage: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    changed_by_user_id: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    changed_by_name: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    changed_by_role: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    work_item: Mapped[WorkItem] = relationship(
        back_populates="stage_history",
    )


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    recipient_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(250),
        nullable=False,
    )

    message: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    notification_type: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        default="process_tracking",
    )

    work_item_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "work_items.id",
            ondelete="CASCADE",
        ),
        nullable=True,
        index=True,
    )

    is_read: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )
