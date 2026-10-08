import { ERROR_DICTIONARY } from "./errorDictionary.js";

/**
 * Error base de la aplicación. Se construye SIEMPRE con un código del diccionario.
 *   throw new AppError("EVENT_NOT_FOUND")
 *   throw new AppError("INVALID_ID", { details: { field: "id", value: "abc" } })
 */
export class AppError extends Error {
  constructor(code = "INTERNAL_ERROR", { message, details } = {}) {
    const entry = ERROR_DICTIONARY[code] ?? ERROR_DICTIONARY.INTERNAL_ERROR;
    super(message ?? entry.message);

    this.name = this.constructor.name;
    this.code = ERROR_DICTIONARY[code] ? code : "INTERNAL_ERROR";
    this.status = entry.status;
    this.details = details;
    this.isOperational = true; // error esperado (no es un bug)
    Error.captureStackTrace?.(this, this.constructor);
  }
}

// Subclases por tipo: permiten `instanceof` y dejan clara la intención en el código.
export class ValidationError     extends AppError { constructor(code = "VALIDATION_ERROR", opts) { super(code, opts); } }
export class AuthenticationError extends AppError { constructor(code = "UNAUTHENTICATED", opts)  { super(code, opts); } }
export class AuthorizationError  extends AppError { constructor(code = "FORBIDDEN", opts)        { super(code, opts); } }
export class NotFoundError       extends AppError { constructor(code = "NOT_FOUND", opts)        { super(code, opts); } }
export class ConflictError       extends AppError { constructor(code = "DUPLICATE_KEY", opts)    { super(code, opts); } }
export class MockError           extends AppError { constructor(code = "MOCK_GENERATION_FAILED", opts) { super(code, opts); } }
