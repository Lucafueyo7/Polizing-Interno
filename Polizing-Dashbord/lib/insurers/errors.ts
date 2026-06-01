/**
 * Jerarquía de errores compartida por todos los adapters de aseguradoras.
 *
 * Permite que el código que orquesta (rutas API, server actions, cron) distinga
 * fallos de autenticación, de negocio o de capacidad no soportada sin acoplarse
 * a un proveedor concreto.
 */

export type InsurerErrorContext = {
  /** Slug del proveedor que originó el error (ej. "berkley"). */
  provider?: string;
  /** Error original encadenado. */
  cause?: unknown;
  /** Código HTTP asociado, si aplica. */
  status?: number;
  /** Detalle legible adicional (faultstring, error_description, etc.). */
  detail?: string;
};

export class InsurerError extends Error {
  readonly provider?: string;
  readonly status?: number;
  readonly detail?: string;

  constructor(message: string, ctx: InsurerErrorContext = {}) {
    super(message, { cause: ctx.cause });
    this.name = "InsurerError";
    this.provider = ctx.provider;
    this.status = ctx.status;
    this.detail = ctx.detail;
  }
}

/** Fallo al autenticar contra la aseguradora (token OAuth, credenciales SOAP). */
export class InsurerAuthError extends InsurerError {
  constructor(message = "Fallo de autenticación con la aseguradora", ctx: InsurerErrorContext = {}) {
    super(message, ctx);
    this.name = "InsurerAuthError";
  }
}

/**
 * Error de negocio devuelto por la aseguradora con HTTP 200 / SOAP OK pero un
 * código de error en el cuerpo (ErrorCodigo ≠ 0, error_description, etc.).
 */
export class InsurerBusinessError extends InsurerError {
  readonly code?: string;

  constructor(message: string, ctx: InsurerErrorContext & { code?: string } = {}) {
    super(message, ctx);
    this.name = "InsurerBusinessError";
    this.code = ctx.code;
  }
}

/** El proveedor no soporta la capacidad solicitada (ej. Fed.Patronal y novedades). */
export class NotSupportedError extends InsurerError {
  constructor(message: string, ctx: InsurerErrorContext = {}) {
    super(message, ctx);
    this.name = "NotSupportedError";
  }
}
