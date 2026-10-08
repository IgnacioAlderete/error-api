// Diccionario central de errores: cada código define status HTTP y mensaje por defecto.
// Nadie escribe status ni mensajes sueltos en services/controllers: se usa un código de acá.
export const ERROR_DICTIONARY = {
  // 400 - validaciones
  VALIDATION_ERROR:      { status: 400, message: "Los datos enviados no son válidos" },
  MISSING_FIELDS:        { status: 400, message: "Faltan campos obligatorios" },
  INVALID_ID:            { status: 400, message: "El ID enviado no es válido" },
  INVALID_JSON:          { status: 400, message: "El cuerpo de la petición no es un JSON válido" },
  INVALID_DATE:          { status: 400, message: "La fecha enviada no es válida" },
  PAST_DATE:             { status: 400, message: "La fecha del evento no puede estar en el pasado" },
  INVALID_CAPACITY:      { status: 400, message: "La capacidad debe ser un número mayor a 0" },
  INVALID_PRICE:         { status: 400, message: "El precio debe ser un número mayor o igual a 0" },
  INVALID_STATUS:        { status: 400, message: "El status enviado no es válido" },
  INVALID_QUERY_PARAM:   { status: 400, message: "Parámetro de consulta inválido" },
  INVALID_QUANTITY:      { status: 400, message: "La cantidad debe ser un número entero mayor a 0" },
  WEAK_PASSWORD:         { status: 400, message: "La contraseña debe tener al menos 8 caracteres" },
  NO_FIELDS_TO_UPDATE:   { status: 400, message: "No hay campos válidos para actualizar" },
  INVALID_STATE_CHANGE:  { status: 400, message: "El cambio de estado no está permitido" },
  EVENT_NOT_PUBLISHED:   { status: 400, message: "El evento no está publicado" },
  TICKET_ALREADY_CANCELLED: { status: 400, message: "El ticket ya está cancelado" },

  // 401 / 403
  UNAUTHENTICATED:       { status: 401, message: "No autenticado: token ausente, inválido o vencido" },
  INVALID_CREDENTIALS:   { status: 401, message: "Credenciales inválidas" },
  FORBIDDEN:             { status: 403, message: "No tenés permisos para realizar esta acción" },

  // 404
  NOT_FOUND:             { status: 404, message: "Recurso no encontrado" },
  ROUTE_NOT_FOUND:       { status: 404, message: "La ruta solicitada no existe" },
  EVENT_NOT_FOUND:       { status: 404, message: "Evento no encontrado" },
  TICKET_NOT_FOUND:      { status: 404, message: "Ticket no encontrado" },

  // 409
  EMAIL_ALREADY_EXISTS:  { status: 409, message: "El email ya está registrado" },
  DUPLICATE_TICKET:      { status: 409, message: "Ya tenés un ticket activo para este evento" },
  INSUFFICIENT_CAPACITY: { status: 409, message: "No hay suficientes cupos disponibles" },
  DUPLICATE_KEY:         { status: 409, message: "Ya existe un registro con esos datos" },

  // Módulo de mocks
  MOCK_INVALID_QUANTITY: { status: 400, message: "La cantidad de mocks debe ser un entero entre 1 y 100" },
  MOCK_INVALID_PAYLOAD:  { status: 400, message: "El cuerpo debe incluir al menos 'users' o 'events' con cantidades enteras válidas" },
  MOCK_GENERATION_FAILED:{ status: 500, message: "Falló la generación de datos de prueba" },

  // 500
  INTERNAL_ERROR:        { status: 500, message: "Error interno del servidor" }
};
