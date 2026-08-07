from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
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

    source_version: Mapped[str | None] = (
        mapped_column(
            String(100),
            nullable=True,
        )
    )

    target_version: Mapped[str | None] = (
        mapped_column(
            String(100),
            nullable=True,
        )
    )

    created_at: Mapped[datetime] = (
        mapped_column(
            DateTime,
            nullable=False,
            server_default=func.now(),
        )
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


class RequirementChange(Base):
    __tablename__ = "requirement_changes"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    analysis_run_id: Mapped[int] = (
        mapped_column(
            ForeignKey(
                "analysis_runs.id",
                ondelete="CASCADE",
            ),
            nullable=False,
            index=True,
        )
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

    change_type: Mapped[str] = (
        mapped_column(
            String(100),
            nullable=False,
        )
    )

    risk_score: Mapped[float] = (
        mapped_column(
            Float,
            nullable=False,
        )
    )

    risk_level: Mapped[str] = (
        mapped_column(
            String(50),
            nullable=False,
        )
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

    created_at: Mapped[datetime] = (
        mapped_column(
            DateTime,
            nullable=False,
            server_default=func.now(),
        )
    )

    analysis_run: Mapped[
        AnalysisRun
    ] = relationship(
        back_populates=(
            "requirement_changes"
        )
    )


class DefectRanking(Base):
    __tablename__ = "defect_rankings"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    analysis_run_id: Mapped[int] = (
        mapped_column(
            ForeignKey(
                "analysis_runs.id",
                ondelete="CASCADE",
            ),
            nullable=False,
            index=True,
        )
    )

    defect_id: Mapped[
        str | None
    ] = mapped_column(
        String(100),
        nullable=True,
    )

    defect_text: Mapped[str] = (
        mapped_column(
            Text,
            nullable=False,
        )
    )

    change_id: Mapped[
        str | None
    ] = mapped_column(
        String(100),
        nullable=True,
    )

    relevance_score: Mapped[float] = (
        mapped_column(
            Float,
            nullable=False,
        )
    )

    rank_position: Mapped[int] = (
        mapped_column(
            Integer,
            nullable=False,
        )
    )

    reason: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = (
        mapped_column(
            DateTime,
            nullable=False,
            server_default=func.now(),
        )
    )

    analysis_run: Mapped[
        AnalysisRun
    ] = relationship(
        back_populates="defect_rankings"
    )