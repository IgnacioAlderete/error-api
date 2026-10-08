## Manejo de errores

Todos los errores esperados de la API pasan por **un solo lugar**: el middleware global (`src/middleware/error.middleware.js`).
Services y controllers no arman respuestas de error: lanzan un error personalizado y el controller hace `next(error)`.

```
src/errors/
  errorDictionary.js   # código -> { status, message }  (única fuente de verdad)
  CustomError.js       # AppError + ValidationError, AuthenticationError, AuthorizationError,
                       #            NotFoundError, ConflictError, MockError
  index.js
src/middleware/
  error.middleware.js  # notFoundMiddleware (404) + errorMiddleware (respuesta uniforme)
  auth.middleware.js   # authenticateJWT / authenticateCurrent / authorizeRoles -> next(AppError)
```

Uso en un service: `throw new NotFoundError("EVENT_NOT_FOUND", { details: { id } })`

### Registro en `app.js` (orden importante)

```js
import { errorMiddleware, notFoundMiddleware } from "./src/middleware/error.middleware.js";
import mocksRouter from "./src/routes/mocks.router.js";

app.use("/api/mocks", mocksRouter);
// ... resto de las rutas ...
app.use(notFoundMiddleware);   // después de TODAS las rutas
app.use(errorMiddleware);      // último de todos
```

### Estructura de la respuesta de error

```json
{
  "status": "error",
  "code": "MOCK_INVALID_QUANTITY",
  "message": "La cantidad de mocks debe ser un entero entre 1 y 100",
  "details": { "field": "quantity", "received": "abc", "min": 1, "max": 100 },
  "path": "/api/mocks/users?quantity=abc",
  "timestamp": "2026-10-08T16:37:56.644Z"
}
```

`details` es opcional. Los errores inesperados (bugs) responden `500 INTERNAL_ERROR` sin exponer el mensaje interno cuando `NODE_ENV=production`.
El middleware también traduce errores de Mongoose (`CastError`, `ValidationError`, clave duplicada 11000), de JWT y JSON mal formado.

| HTTP | Códigos (ejemplos) |
|------|--------------------|
| 400 | `VALIDATION_ERROR`, `MISSING_FIELDS`, `INVALID_ID`, `INVALID_JSON`, `INVALID_DATE`, `INVALID_QUANTITY`, `MOCK_INVALID_QUANTITY`, `MOCK_INVALID_PAYLOAD` |
| 401 | `UNAUTHENTICATED`, `INVALID_CREDENTIALS` |
| 403 | `FORBIDDEN` |
| 404 | `EVENT_NOT_FOUND`, `TICKET_NOT_FOUND`, `ROUTE_NOT_FOUND` |
| 409 | `EMAIL_ALREADY_EXISTS`, `DUPLICATE_TICKET`, `INSUFFICIENT_CAPACITY`, `DUPLICATE_KEY` |
| 500 | `MOCK_GENERATION_FAILED`, `INTERNAL_ERROR` |

Lista completa en `src/errors/errorDictionary.js`.

### Cómo probar los casos inválidos

Reemplazá `3000` por tu puerto.

**Módulo de mocks** (cantidad válida: entero entre 1 y 100; sin `quantity` usa 10)

```bash
curl "localhost:3000/api/mocks/users?quantity=5"          # 200 OK
curl "localhost:3000/api/mocks/users?quantity=0"          # 400 MOCK_INVALID_QUANTITY
curl "localhost:3000/api/mocks/users?quantity=-3"         # 400 MOCK_INVALID_QUANTITY
curl "localhost:3000/api/mocks/events?quantity=abc"       # 400 MOCK_INVALID_QUANTITY
curl "localhost:3000/api/mocks/events?quantity=2.5"       # 400 MOCK_INVALID_QUANTITY
curl "localhost:3000/api/mocks/events?quantity=101"       # 400 MOCK_INVALID_QUANTITY

# POST con datos incorrectos
curl -X POST localhost:3000/api/mocks/generate -H "Content-Type: application/json" -d '{"users":3,"events":2}'   # 201
curl -X POST localhost:3000/api/mocks/generate -H "Content-Type: application/json" -d '{}'                       # 400 MOCK_INVALID_PAYLOAD
curl -X POST localhost:3000/api/mocks/generate -H "Content-Type: application/json" -d '{"users":3,"foo":1}'      # 400 MOCK_INVALID_PAYLOAD
curl -X POST localhost:3000/api/mocks/generate -H "Content-Type: application/json" -d '{"users":0}'              # 400 MOCK_INVALID_QUANTITY

# Falla durante la generación (solo si NODE_ENV != production)
curl "localhost:3000/api/mocks/users?quantity=3&forceError=true"   # 500 MOCK_GENERATION_FAILED
```

**Resto de la API**

```bash
curl localhost:3000/api/ruta-que-no-existe                                   # 404 ROUTE_NOT_FOUND
curl localhost:3000/api/events/abc                                           # 400 INVALID_ID
curl localhost:3000/api/events/64b000000000000000000000                      # 404 EVENT_NOT_FOUND
curl -X POST localhost:3000/api/events -H "Content-Type: application/json" -d '{'    # 400 INVALID_JSON
curl -X POST localhost:3000/api/events -H "Content-Type: application/json" -d '{}'   # 401 UNAUTHENTICATED (sin token)
curl -X POST localhost:3000/api/sessions/login -H "Content-Type: application/json" -d '{"email":"a@a.com","password":"mal"}'   # 401 INVALID_CREDENTIALS
curl -X POST localhost:3000/api/sessions/register -H "Content-Type: application/json" -d '{"email":"a@a.com"}'                # 400 MISSING_FIELDS
curl "localhost:3000/api/events?status=foo"                                  # 400 INVALID_STATUS
```
