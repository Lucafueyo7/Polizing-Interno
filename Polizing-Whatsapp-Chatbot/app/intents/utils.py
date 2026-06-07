import re
from datetime import date as _date

ALLOWED_MEDIA_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/webp"}


def normalize_date(text: str) -> str | None:
    parts = re.split(r"[\-./\s]+", text.strip())
    if len(parts) != 3:
        return None
    try:
        day, month, raw_year = int(parts[0]), int(parts[1]), parts[2]
    except ValueError:
        return None
    y = len(raw_year)
    if y <= 2:
        yv = int(raw_year)
        year = 2000 + yv if yv <= 30 else 1900 + yv
    elif y == 4:
        year = int(raw_year)
    else:
        return None
    try:
        _date(year, month, day)
    except ValueError:
        return None
    return f"{day:02d}/{month:02d}/{year:04d}"


def normalize_time(text: str) -> str | None:
    t = text.strip().lower()
    t = re.sub(r"\s*(horas|hs|h)\s*$", "", t)
    # 4-digit no-separator case: "2130" → "21:30"
    if re.fullmatch(r"\d{3,4}", t):
        t = t[:-2] + ":" + t[-2:]
    t = re.sub(r"[.,\s]", ":", t)
    parts = t.split(":")
    if len(parts) == 1:
        parts.append("00")
    if len(parts) != 2:
        return None
    try:
        hour, minute = int(parts[0]), int(parts[1])
    except ValueError:
        return None
    if not (0 <= hour <= 23 and 0 <= minute <= 59):
        return None
    return f"{hour:02d}:{minute:02d}"


def is_keyword(text: str, keyword: str) -> bool:
    return text.strip().upper() == keyword.upper()


def normalize_option(text: str) -> str | None:
    value = text.strip().lower()
    aliases = {
        "tarjeta": "1",
        "tarjeta de circulacion": "1",
        "comprobante": "2",
        "pago": "2",
        "siniestro": "3",
    }
    if value in {"1", "2", "3"}:
        return value
    return aliases.get(value)


def parse_index(text: str) -> int | None:
    if not text.isdigit():
        return None
    return int(text) - 1


def format_policies(policies: list[dict]) -> str:
    return "\n".join(
        f"{index}. {policy['policy_number']} - {policy['domain']} - {policy['description']}"
        for index, policy in enumerate(policies, start=1)
    )


def valid_media(media: dict | None) -> bool:
    if not media:
        return False
    mime_type = media.get("mime_type")
    return bool(mime_type in ALLOWED_MEDIA_TYPES or str(mime_type).startswith("image/"))
