from __future__ import annotations

import sqlite3
from pathlib import Path


def find_database() -> Path:
    project_root = (
        Path(__file__)
        .resolve()
        .parents[2]
    )

    candidates = [
        (
            project_root
            / "backend"
            / "scopediff.db"
        ),
        (
            project_root
            / "scopediff.db"
        ),
        (
            project_root
            / "backend"
            / "app"
            / "scopediff.db"
        ),
    ]

    for candidate in candidates:
        if candidate.exists():
            return candidate

    raise FileNotFoundError(
        "ScopeDiff SQLite "
        "veritabanı bulunamadı. "
        "Beklenen konumlar: "
        + ", ".join(
            str(path)
            for path in candidates
        )
    )


def main() -> None:
    database_path = (
        find_database()
    )

    connection = sqlite3.connect(
        database_path
    )

    try:
        connection.execute(
            "PRAGMA foreign_keys = ON"
        )

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS work_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                analysis_run_id INTEGER NULL,

                external_id VARCHAR(120) NULL,

                title VARCHAR(500) NOT NULL,

                portal_menu VARCHAR(500) NULL,
                module VARCHAR(200) NULL,

                developer VARCHAR(200) NULL,
                analyst VARCHAR(200) NULL,

                due_date DATE NULL,
                due_status_text VARCHAR(300) NULL,

                test_given_status VARCHAR(300) NULL,
                analysis_status VARCHAR(300) NULL,
                test_status VARCHAR(300) NULL,

                current_stage VARCHAR(50)
                    NOT NULL
                    DEFAULT 'TASARIM',

                stage_override VARCHAR(50) NULL,

                is_blocked BOOLEAN
                    NOT NULL
                    DEFAULT 0,

                source_file VARCHAR(500) NULL,
                source_sheet VARCHAR(200) NULL,
                source_row INTEGER NULL,

                notes TEXT NULL,

                created_at DATETIME
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                updated_at DATETIME
                    NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (analysis_run_id)
                    REFERENCES analysis_runs(id)
                    ON DELETE SET NULL
            )
            """
        )

        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS
                ix_work_items_analysis_run_id
            ON work_items (
                analysis_run_id
            )
            """
        )

        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS
                ix_work_items_external_id
            ON work_items (
                external_id
            )
            """
        )

        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS
                ix_work_items_stage
            ON work_items (
                current_stage
            )
            """
        )

        connection.commit()

        print(
            "OK - process tracking "
            "schema ready: "
            f"{database_path}"
        )

    finally:
        connection.close()


if __name__ == "__main__":
    main()