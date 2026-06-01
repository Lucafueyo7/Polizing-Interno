from fastapi import Header, HTTPException, Request, status

from app.config import get_settings


def require_outbound_api_key(x_api_key: str | None = Header(default=None)) -> None:
    settings = get_settings()
    if x_api_key != settings.outbound_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")


def admin_is_authenticated(request: Request) -> bool:
    return bool(request.session.get("admin_authenticated"))


def require_admin(request: Request) -> None:
    if not admin_is_authenticated(request):
        raise HTTPException(status_code=status.HTTP_303_SEE_OTHER, headers={"Location": "/admin/login"})
