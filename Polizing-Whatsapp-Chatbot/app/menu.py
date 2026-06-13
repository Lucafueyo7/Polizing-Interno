from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.messages import get_message


@dataclass(frozen=True)
class MenuAction:
    flow: str            # clave del handler en ConversationEngine
    prompt: str          # mensaje del prompt de selección de póliza
    label: str           # línea mostrada en el menú
    scope: str = "vehiculos"   # qué pólizas listar (ver listVigentesByClienteId)
    corporate_only: bool = False


# Orden del menú. La opción de comprobantes de pago sólo aparece para clientes
# corporativos. Cada flujo arranca pidiendo seleccionar una póliza.
MENU_ACTIONS: list[MenuAction] = [
    MenuAction("circulation_card", "policy_list_prompt", "Obtener tarjeta de circulacion"),
    MenuAction(
        "payment_receipt",
        "payment_policy_prompt",
        "Adjuntar comprobante de pago",
        scope="todas",
        corporate_only=True,
    ),
    MenuAction("claim", "claim_policy_prompt", "Registrar siniestro"),
    MenuAction("policy_document", "policy_doc_prompt", "Obtener poliza"),
]


def available_actions(is_corporate: bool) -> list[MenuAction]:
    return [a for a in MENU_ACTIONS if is_corporate or not a.corporate_only]


def render_menu(db: Session, is_corporate: bool) -> str:
    """Arma el menú principal con numeración contigua según el cliente."""
    actions = available_actions(is_corporate)
    options = "\n".join(f"{i}. {a.label}" for i, a in enumerate(actions, start=1))
    header = get_message(db, "menu_header")
    footer = get_message(db, "menu_footer")
    return f"{header}\n\n{options}\n\n{footer}"
