import { AppError } from "../errors/CustomError.js";
import { ERROR_DICTIONARY } from "../errors/errorDictionary.js";

// 404 para rutas inexistentes: se registra DESPUÉS de todas las rutas.
export const notFoundMiddleware = (req, res, next) => {
  next(new AppError("ROUTE_NOT_FOUND", {
    details: { method: req.method, path: req.originalUrl }
  }));
};

// Traduce errores "de librería" (Mongoose, JWT, body-parser) a AppError.
const normalizeError = (err) => {
  if (err instanceof AppError) return err;

  if (err?.type === "entity.parse.failed" || (err instanceof SyntaxError && err.status === 400 && "body" in err)) {
    return new AppError("INVALID_JSON");
  }
  if (err?.name === "CastError") {
    return new AppError("INVALID_ID", { details: { field: err.path, value: String(err.value) } });
  }
  if (err?.name === "ValidationError" && err.errors) {
    const details = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
    return new AppError("VALIDATION_ERROR", { details });
  }
  if (err?.code === 11000) {
    return new AppError("DUPLICATE_KEY", { details: { fields: Object.keys(err.keyValue ?? {}) } });
  }
  if (["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(err?.name)) {
    return new AppError("UNAUTHENTICATED");
  }
  return err;
};

// Middleware global: ÚNICO lugar que arma la respuesta de error.
// Formato: { status:"error", code, message, details?, path, timestamp }
// eslint-disable-next-line no-unused-vars
export const errorMiddleware = (err, req, res, next) => {
  const error = normalizeError(err);
  const isKnown = error instanceof AppError;

  if (!isKnown) console.error(err);            // bugs inesperados: log completo
  else if (error.status >= 500) console.error(error);

  const fallback = ERROR_DICTIONARY.INTERNAL_ERROR;
  const status = isKnown ? error.status : fallback.status;
  const expose = isKnown || process.env.NODE_ENV !== "production";

  res.status(status).json({
    status: "error",
    code: isKnown ? error.code : "INTERNAL_ERROR",
    message: isKnown ? error.message : (expose ? (err?.message || fallback.message) : fallback.message),
    ...(isKnown && error.details !== undefined && { details: error.details }),
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
};
