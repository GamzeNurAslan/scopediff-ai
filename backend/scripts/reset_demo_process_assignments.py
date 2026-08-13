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
        project_root
        / "backend"
        / "scopediff.db",

        project_root
        / "scopediff.db",

        project_root
        / "backend"
        / "app"
        / "scopediff.db",
    ]

    for candidate in candidates:
        if candidate.exists():
            return candidate

    raise FileNotFoundError(
        "ScopeDiff veritabanı bulunamadı."
    )


def main() -> None:
    database_path = (
        find_database()
    )

    connection = sqlite3.connect(
        database_path
    )

    try:
        cursor = connection.execute(
            """
            UPDATE work_items
            SET
                developer = NULL,
                analyst = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE source_file = ?
            """,
            (
                "process_tracking_sample.xlsx",
            ),
        )

        connection.commit()

        print(
            "OK - demo atamalari temizlendi."
        )

        print(
            f"Guncellenen kayit: "
            f"{cursor.rowcount}"
        )

        print(
            database_path
        )

    finally:
        connection.close()


if __name__ == "__main__":
    main()