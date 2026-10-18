"""
audit_log.py — F13.10 Audit log middleware for RESTRICTED asset access.

Intercepts all GET /catalog/** responses. When the response carries the header
X-Asset-Classification: RESTRICTED, a structured JSON entry is emitted to the
"audit" logger at INFO level. Requests are never blocked.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp

audit_logger = logging.getLogger("audit")


class AuditLogMiddleware(BaseHTTPMiddleware):
    """Log access to RESTRICTED catalog assets without blocking any request."""

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore[override]
        """Pass the request through and inspect the response headers for classification."""
        response: Response = await call_next(request)

        if (
            request.method == "GET"
            and request.url.path.startswith("/catalog/")
            and response.headers.get("X-Asset-Classification", "").upper() == "RESTRICTED"
        ):
            audit_logger.info(
                json.dumps({
                    "event": "restricted_access",
                    "user": request.headers.get("Username", "unknown"),
                    "asset_id": request.url.path,
                    "timestamp": datetime.now(tz=timezone.utc).isoformat(),
                    "method": request.method,
                })
            )

        return response
