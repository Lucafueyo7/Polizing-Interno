ALLOWED_MEDIA_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/webp"}


def normalize_option(text: str) -> str | None:
    value = text.strip().lower()
    aliases = {
        "tarjeta": "1",
        "tarjeta de circulacion": "1",
        "comprobante": "2",
        "pago": "2",
        "siniestro": "3",
        "solicitud": "4",
        "nueva poliza": "4",
        "solicitar": "4",
    }
    if value in {"1", "2", "3", "4"}:
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
