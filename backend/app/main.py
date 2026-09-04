from __future__ import annotations

from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import (
    CORSMiddleware,
)

from backend.app.api.routes import (
    router,
)
from backend.app.database.database import (
    init_db,
)


def create_app(
    initialize_database: bool = True,
) -> FastAPI:

    configured_origins = os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,https://gamzenuraslan.github.io",
    )
    allow_origins = [
        origin.strip().rstrip("/")
        for origin in configured_origins.split(",")
        if origin.strip()
    ]

    @asynccontextmanager
    async def lifespan(
        application: FastAPI,
    ):
        if initialize_database:
            init_db()

        yield

    application = FastAPI(
        title="ScopeDiff AI API",
        description=(
            "AI-assisted requirement change "
            "analysis and decision-support API."
        ),
        version="0.1.0",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.get(
        "/health"
    )
    def health_check() -> dict[
        str,
        str,
    ]:
        return {
            "status": "ok",
            "service": "ScopeDiff AI",
        }

    application.include_router(
        router
    )

    return application


app = create_app()
