from __future__ import annotations

from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import (
    Alignment,
    Font,
    PatternFill,
)
from openpyxl.worksheet.worksheet import Worksheet

from backend.app.database.models import (
    AnalysisRun,
)


class ExcelReportGenerator:
    """
    ScopeDiff analiz sonuçlarını biçimlendirilmiş
    Excel raporuna dönüştürür.
    """

    NAVY = "14213D"
    DARK_NAVY = "0B132B"
    ORANGE = "F59E0B"
    WHITE = "FFFFFF"
    LIGHT_GRAY = "E5E7EB"
    STATIC_GRAY = "6B7280"

    RISK_COLORS = {
        "low": "DCFCE7",
        "medium": "FEF3C7",
        "high": "FED7AA",
        "critical": "FECACA",
    }

    def generate(
        self,
        analysis: AnalysisRun,
        output_path: str | Path,
    ) -> Path:
        """
        Bir AnalysisRun kaydından .xlsx raporu üretir.
        """

        path = Path(output_path)

        if path.suffix.lower() != ".xlsx":
            raise ValueError(
                "Excel raporunun uzantısı .xlsx olmalıdır."
            )

        path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        workbook = Workbook()

        summary_sheet = workbook.active
        summary_sheet.title = "Summary"

        changes_sheet = workbook.create_sheet(
            "Requirement Changes"
        )

        rankings_sheet = workbook.create_sheet(
            "Defect Rankings"
        )

        self._build_summary_sheet(
            summary_sheet,
            analysis,
        )

        self._build_requirement_changes_sheet(
            changes_sheet,
            analysis,
        )

        self._build_defect_rankings_sheet(
            rankings_sheet,
            analysis,
        )

        workbook.save(path)

        return path

    def _build_summary_sheet(
        self,
        sheet: Worksheet,
        analysis: AnalysisRun,
    ) -> None:
        sheet.sheet_view.showGridLines = False
        sheet.sheet_properties.tabColor = self.ORANGE

        sheet.merge_cells(
            "A1:D1"
        )

        title_cell = sheet["A1"]

        title_cell.value = (
            "ScopeDiff AI - Analysis Report"
        )

        title_cell.font = Font(
            bold=True,
            size=18,
            color=self.WHITE,
        )

        title_cell.fill = PatternFill(
            fill_type="solid",
            fgColor=self.DARK_NAVY,
        )

        title_cell.alignment = Alignment(
            horizontal="left",
            vertical="center",
        )

        sheet.row_dimensions[1].height = 30

        metadata = [
            (
                "Analysis ID",
                (
                    analysis.id
                    if analysis.id is not None
                    else "-"
                ),
            ),
            (
                "Analysis Name",
                analysis.analysis_name,
            ),
            (
                "Source Version",
                analysis.source_version or "-",
            ),
            (
                "Target Version",
                analysis.target_version or "-",
            ),
            (
                "Created At",
                analysis.created_at or "-",
            ),
        ]

        start_row = 3

        for offset, (
            label,
            value,
        ) in enumerate(metadata):
            row = start_row + offset

            sheet.cell(
                row=row,
                column=1,
                value=label,
            )

            sheet.cell(
                row=row,
                column=2,
                value=value,
            )

            self._style_summary_label(
                sheet.cell(
                    row=row,
                    column=1,
                )
            )

        sheet["A9"] = "Analysis Metrics"
        self._style_section_title(
            sheet["A9"]
        )

        metrics = [
            (
                "Total Requirement Changes",
                (
                    "=COUNTA("
                    "'Requirement Changes'!A:A"
                    ")-1"
                ),
            ),
            (
                "Total Defect Rankings",
                (
                    "=COUNTA("
                    "'Defect Rankings'!A:A"
                    ")-1"
                ),
            ),
            (
                "Average Risk Score",
                (
                    "=IFERROR("
                    "AVERAGE("
                    "'Requirement Changes'!E:E"
                    "),0)"
                ),
            ),
            (
                "Average Relevance Score",
                (
                    "=IFERROR("
                    "AVERAGE("
                    "'Defect Rankings'!E:E"
                    "),0)"
                ),
            ),
        ]

        for offset, (
            label,
            formula,
        ) in enumerate(
            metrics,
            start=10,
        ):
            sheet.cell(
                row=offset,
                column=1,
                value=label,
            )

            sheet.cell(
                row=offset,
                column=2,
                value=formula,
            )

            self._style_summary_label(
                sheet.cell(
                    row=offset,
                    column=1,
                )
            )

        sheet["B12"].number_format = "0.0"
        sheet["B13"].number_format = "0.0%"

        sheet["A16"] = "Risk Distribution"
        self._style_section_title(
            sheet["A16"]
        )

        risks = [
            "low",
            "medium",
            "high",
            "critical",
        ]

        for index, risk in enumerate(
            risks,
            start=17,
        ):
            sheet.cell(
                row=index,
                column=1,
                value=risk.capitalize(),
            )

            sheet.cell(
                row=index,
                column=2,
                value=(
                    "=COUNTIF("
                    "'Requirement Changes'!F:F,"
                    f'"{risk}"'
                    ")"
                ),
            )

            risk_cell = sheet.cell(
                row=index,
                column=1,
            )

            risk_cell.fill = PatternFill(
                fill_type="solid",
                fgColor=self.RISK_COLORS[
                    risk
                ],
            )

            risk_cell.font = Font(
                bold=True,
            )

        if (
            analysis.created_at is not None
        ):
            sheet["B7"].number_format = (
                "yyyy-mm-dd hh:mm"
            )

        sheet.column_dimensions["A"].width = 30
        sheet.column_dimensions["B"].width = 28
        sheet.column_dimensions["C"].width = 18
        sheet.column_dimensions["D"].width = 18

    def _build_requirement_changes_sheet(
        self,
        sheet: Worksheet,
        analysis: AnalysisRun,
    ) -> None:
        headers = [
            "ID",
            "Old Requirement ID",
            "New Requirement ID",
            "Change Type",
            "Risk Score",
            "Risk Level",
            "Confidence",
            "Explanation",
        ]

        self._write_table_header(
            sheet,
            headers,
        )

        for row_index, change in enumerate(
            analysis.requirement_changes,
            start=2,
        ):
            values = [
                change.id,
                change.old_requirement_id,
                change.new_requirement_id,
                change.change_type,
                change.risk_score,
                change.risk_level,
                change.confidence,
                change.explanation,
            ]

            for column_index, value in enumerate(
                values,
                start=1,
            ):
                sheet.cell(
                    row=row_index,
                    column=column_index,
                    value=value,
                )

            sheet.cell(
                row=row_index,
                column=5,
            ).number_format = "0.0"

            sheet.cell(
                row=row_index,
                column=7,
            ).number_format = "0.0%"

            risk_level = str(
                change.risk_level
            ).lower()

            if (
                risk_level
                in self.RISK_COLORS
            ):
                sheet.cell(
                    row=row_index,
                    column=6,
                ).fill = PatternFill(
                    fill_type="solid",
                    fgColor=(
                        self.RISK_COLORS[
                            risk_level
                        ]
                    ),
                )

            sheet.cell(
                row=row_index,
                column=8,
            ).alignment = Alignment(
                wrap_text=True,
                vertical="top",
            )

        sheet.freeze_panes = "A2"
        sheet.auto_filter.ref = (
            f"A1:H{max(sheet.max_row, 1)}"
        )

        widths = {
            "A": 10,
            "B": 22,
            "C": 22,
            "D": 24,
            "E": 14,
            "F": 15,
            "G": 14,
            "H": 55,
        }

        self._set_column_widths(
            sheet,
            widths,
        )

    def _build_defect_rankings_sheet(
        self,
        sheet: Worksheet,
        analysis: AnalysisRun,
    ) -> None:
        headers = [
            "ID",
            "Defect ID",
            "Defect Text",
            "Change ID",
            "Relevance Score",
            "Rank Position",
            "Reason",
        ]

        self._write_table_header(
            sheet,
            headers,
        )

        rankings = sorted(
            analysis.defect_rankings,
            key=lambda item: (
                item.defect_id or "",
                item.rank_position,
            ),
        )

        for row_index, ranking in enumerate(
            rankings,
            start=2,
        ):
            values = [
                ranking.id,
                ranking.defect_id,
                ranking.defect_text,
                ranking.change_id,
                ranking.relevance_score,
                ranking.rank_position,
                ranking.reason,
            ]

            for column_index, value in enumerate(
                values,
                start=1,
            ):
                sheet.cell(
                    row=row_index,
                    column=column_index,
                    value=value,
                )

            sheet.cell(
                row=row_index,
                column=5,
            ).number_format = "0.0%"

            sheet.cell(
                row=row_index,
                column=3,
            ).alignment = Alignment(
                wrap_text=True,
                vertical="top",
            )

            sheet.cell(
                row=row_index,
                column=7,
            ).alignment = Alignment(
                wrap_text=True,
                vertical="top",
            )

        sheet.freeze_panes = "A2"

        sheet.auto_filter.ref = (
            f"A1:G{max(sheet.max_row, 1)}"
        )

        widths = {
            "A": 10,
            "B": 16,
            "C": 48,
            "D": 18,
            "E": 18,
            "F": 16,
            "G": 60,
        }

        self._set_column_widths(
            sheet,
            widths,
        )

    def _write_table_header(
        self,
        sheet: Worksheet,
        headers: list[str],
    ) -> None:
        sheet.sheet_view.showGridLines = False
        sheet.sheet_properties.tabColor = self.NAVY

        for column_index, header in enumerate(
            headers,
            start=1,
        ):
            cell = sheet.cell(
                row=1,
                column=column_index,
                value=header,
            )

            cell.font = Font(
                bold=True,
                color=self.WHITE,
            )

            cell.fill = PatternFill(
                fill_type="solid",
                fgColor=self.NAVY,
            )

            cell.alignment = Alignment(
                horizontal="center",
                vertical="center",
            )

        sheet.row_dimensions[1].height = 24

    def _style_summary_label(
        self,
        cell,
    ) -> None:
        cell.font = Font(
            bold=True,
            color=self.STATIC_GRAY,
        )

    def _style_section_title(
        self,
        cell,
    ) -> None:
        cell.font = Font(
            bold=True,
            color=self.WHITE,
        )

        cell.fill = PatternFill(
            fill_type="solid",
            fgColor=self.NAVY,
        )

    @staticmethod
    def _set_column_widths(
        sheet: Worksheet,
        widths: dict[str, float],
    ) -> None:
        for column, width in widths.items():
            sheet.column_dimensions[
                column
            ].width = width