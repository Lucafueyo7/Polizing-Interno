from sqlalchemy.orm import Session

from app.models import EditableMessage


DEFAULT_MESSAGES = {
    # El menú principal se arma dinámicamente (las opciones dependen de si el
    # cliente es corporativo). `menu_header`/`menu_footer` envuelven la lista.
    "menu_header": ("Menu principal", "Bienvenido. Seleccione una opcion:"),
    "menu_footer": ("Menu principal", "Responda con el numero de la opcion. En cualquier momento responda 0 para cancelar."),
    "invalid_option": ("Opcion invalida", "No pudimos interpretar su respuesta. Por favor seleccione una opcion valida."),
    "client_not_found": (
        "Cliente no encontrado",
        "No encontramos su numero registrado en nuestro sistema. Por favor comuniquese con su productor de seguros.",
    ),
    "session_expired": (
        "Sesion expirada",
        "La conversacion anterior fue descartada por superar la ventana permitida. Iniciaremos una nueva solicitud.",
    ),
    "cancelled": ("Solicitud cancelada", "La solicitud fue cancelada. Puede iniciar una nueva operacion desde el menu principal."),
    "type_cancel": ("Ayuda cancelar", "Puede responder 0 en cualquier momento para cancelar y volver al menu principal."),
    "policy_list_prompt": ("Seleccion poliza", "Seleccione una poliza:\n\n{policies}"),
    "policy_list_empty": ("Sin polizas", "No encontramos polizas activas asociadas a su numero."),
    "card_success": ("Tarjeta enviada", "Encontramos la tarjeta de circulacion. Se la enviaremos por este medio."),
    "card_link": ("Tarjeta enviada", "Su tarjeta de circulacion: {link}"),
    "card_not_found": ("Tarjeta no encontrada", "No se pudo obtener la tarjeta de circulacion solicitada."),
    "policy_doc_prompt": ("Poliza", "Seleccione la poliza que desea obtener:\n\n{policies}"),
    "policy_doc_success": ("Poliza enviada", "Encontramos su poliza. Se la enviaremos por este medio."),
    "policy_doc_link": ("Poliza enviada", "Su poliza: {link}"),
    "policy_doc_not_found": ("Poliza no encontrada", "No se pudo obtener la poliza solicitada."),
    "payment_not_corporate": (
        "Pago no disponible",
        "La carga de comprobantes de pago esta disponible unicamente para clientes corporativos. Comuniquese con su productor de seguros.",
    ),
    "payment_policy_prompt": (
        "Poliza pago",
        "Seleccione la o las polizas a las que corresponde el comprobante. Si son varias, separelas con coma (por ejemplo: 1,3):\n\n{policies}",
    ),
    "payment_file_prompt": (
        "Archivo pago",
        "Adjunte el o los comprobantes de pago (imagen o PDF), uno por mensaje. Cuando haya enviado todos, responda LISTO.",
    ),
    "payment_more_files_prompt": (
        "Mas comprobantes",
        "Comprobante recibido. Adjunte otro archivo o responda LISTO para terminar.",
    ),
    "payment_no_files": ("Sin comprobantes", "Debe adjuntar al menos un comprobante antes de responder LISTO."),
    "payment_invalid_file": ("Archivo pago invalido", "El archivo recibido no es valido. Envie una imagen o un PDF."),
    "payment_success": ("Pago recibido", "El comprobante fue recibido correctamente. Numero de recepcion: {reference}."),
    "claim_policy_prompt": ("Poliza siniestro", "Seleccione la poliza asociada al siniestro:\n\n{policies}"),
    "claim_date_prompt": ("Fecha siniestro", "Indique la fecha del siniestro con formato DD/MM/AAAA."),
    "claim_time_prompt": ("Hora siniestro", "Indique la hora aproximada del siniestro con formato HH:MM."),
    "claim_place_prompt": ("Lugar siniestro", "Indique el lugar donde ocurrio el siniestro."),
    "claim_description_prompt": ("Descripcion siniestro", "Describa brevemente lo ocurrido."),
    "claim_license_prompt": ("Carnet siniestro", "Adjunte una imagen o PDF del carnet de conducir."),
    "claim_vehicle_card_prompt": ("Cedula siniestro", "Adjunte una imagen o PDF de la cedula verde."),
    "claim_third_parties_prompt": ("Terceros siniestro", "Indique datos de terceros involucrados o responda NO."),
    "claim_police_report_prompt": ("Denuncia siniestro", "Adjunte denuncia policial si corresponde, o responda NO."),
    "claim_photos_prompt": ("Fotos siniestro", "Adjunte fotos/documentos adicionales o responda FINALIZAR."),
    "claim_date_invalid": ("Fecha invalida", "No entendi la fecha. Indique con formato DD/MM/AAAA, por ejemplo: 15/03/2024."),
    "claim_time_invalid": ("Hora invalida", "No entendi la hora. Indique con formato HH:MM, por ejemplo: 21:30."),
    "claim_success": ("Siniestro registrado", "El siniestro fue registrado correctamente. Numero de siniestro: {reference}."),
    "outbound_sent": ("Mensaje externo", "{message}"),
}


def seed_messages(db: Session) -> None:
    for key, (label, content) in DEFAULT_MESSAGES.items():
        exists = db.query(EditableMessage).filter(EditableMessage.key == key).first()
        if not exists:
            db.add(EditableMessage(key=key, label=label, content=content))
    db.commit()


def get_message(db: Session, key: str, **kwargs: object) -> str:
    row = db.query(EditableMessage).filter(EditableMessage.key == key).first()
    content = row.content if row else DEFAULT_MESSAGES.get(key, (key, key))[1]
    if not kwargs:
        return content
    try:
        return content.format(**kwargs)
    except KeyError:
        return content
