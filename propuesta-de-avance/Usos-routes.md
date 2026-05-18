GET /api/clients/by-phone/[phone]
Se llama al inicio de cada mensaje que manda el usuario, antes de hacer cualquier cosa. Si devuelve 404, el bot responde "no estás registrado" y corta. Es el portero de toda la conversación.

GET /api/policies?phone=
Se llama cuando el usuario elige las opciones 2, 3 o 4 del menú (tarjeta, comprobante, siniestro). El bot necesita mostrarle al usuario la lista de sus pólizas para que elija una. No se llama en la opción 1 porque la solicitud de póliza no requiere tener una póliza existente.

POST /api/policy-requests
Se llama al final del flujo opción 1, cuando el usuario terminó los 7 pasos (tipo → dominio → marca → modelo → año → uso → notas) y mandó las notas. Es el único POST que no requiere póliza previa.

POST /api/circulation-card
Se llama cuando el usuario elige opción 2 y selecciona una póliza. El bot busca la tarjeta, la descarga de storage y se la reenvía al usuario por WhatsApp como documento PDF. Si no hay tarjeta → el bot avisa que no está disponible.

POST /api/payment-receipts
Se llama al final del flujo opción 3, cuando el usuario ya eligió la póliza y adjuntó la foto o PDF del comprobante. Crea el registro en pagos con estado pendiente para que el productor lo valide desde el panel.

POST /api/claims
Se llama cuando el usuario manda "FINALIZAR" en el flujo opción 4. Es el más pesado — llega con todos los datos del siniestro (fecha, hora, lugar, descripción, terceros) más todos los archivos (carnet, tarjeta verde, acta policial opcional, fotos). Crea el siniestro y todos sus documentos en una sola transacción.
