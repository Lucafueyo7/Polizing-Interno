from fastapi import APIRouter, Depends, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import EditableMessage
from app.security import admin_is_authenticated


router = APIRouter(prefix="/admin", tags=["admin"])
templates = Jinja2Templates(directory="app/templates")


@router.get("", response_class=HTMLResponse)
def admin_home(request: Request, db: Session = Depends(get_db)):
    if not admin_is_authenticated(request):
        return RedirectResponse("/admin/login", status_code=303)
    messages = db.query(EditableMessage).order_by(EditableMessage.key).all()
    return templates.TemplateResponse("admin_messages.html", {"request": request, "messages": messages, "saved": False})


@router.get("/login", response_class=HTMLResponse)
def login_form(request: Request):
    return templates.TemplateResponse("admin_login.html", {"request": request, "error": None})


@router.post("/login", response_class=HTMLResponse)
def login(request: Request, username: str = Form(...), password: str = Form(...)):
    settings = get_settings()
    if username == settings.admin_username and password == settings.admin_password:
        request.session["admin_authenticated"] = True
        return RedirectResponse("/admin", status_code=303)
    return templates.TemplateResponse("admin_login.html", {"request": request, "error": "Usuario o contrasena invalida"})


@router.post("/logout")
def logout(request: Request):
    request.session.clear()
    return RedirectResponse("/admin/login", status_code=303)


@router.post("/messages", response_class=HTMLResponse)
async def update_messages(request: Request, db: Session = Depends(get_db)):
    if not admin_is_authenticated(request):
        return RedirectResponse("/admin/login", status_code=303)
    form = await request.form()
    messages = db.query(EditableMessage).all()
    for message in messages:
        label = form.get(f"label:{message.id}")
        content = form.get(f"content:{message.id}")
        if isinstance(label, str):
            message.label = label
        if isinstance(content, str):
            message.content = content
    db.commit()
    messages = db.query(EditableMessage).order_by(EditableMessage.key).all()
    return templates.TemplateResponse("admin_messages.html", {"request": request, "messages": messages, "saved": True})
