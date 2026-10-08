import { ValidationError, MockError } from "../errors/index.js";

export const MOCK_MIN = 1;
export const MOCK_MAX = 100;
const MOCK_TYPES = ["users", "events"];

const FIRST = ["Ana", "Bruno", "Camila", "Diego", "Elena", "Facundo", "Gala", "Hugo", "Iris", "Joaquín"];
const LAST = ["Pérez", "Gómez", "Rossi", "Silva", "Núñez", "Díaz", "Sosa", "Molina", "Ríos", "Vega"];
const CITIES = ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", "Salta"];
const CATEGORIES = ["Música", "Tecnología", "Deporte", "Arte", "Gastronomía", "Teatro"];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export class MocksService {
  // Valida cantidad: entero entre 1 y 100. `undefined` -> usa default.
  parseQuantity(value, { field = "quantity", defaultValue = 10 } = {}) {
    if (value === undefined || value === "") return defaultValue;

    const n = typeof value === "string" ? (value.trim() === "" ? NaN : Number(value)) : value;

    if (typeof n !== "number" || !Number.isInteger(n) || n < MOCK_MIN || n > MOCK_MAX) {
      throw new ValidationError("MOCK_INVALID_QUANTITY", {
        details: { field, received: value, min: MOCK_MIN, max: MOCK_MAX }
      });
    }
    return n;
  }

  // Envuelve cualquier falla inesperada del generador en un error propio.
  safeGenerate(type, quantity, { forceError = false } = {}) {
    try {
      if (forceError) throw new Error("Falla simulada (forceError)");
      return Array.from({ length: quantity }, (_, i) => this[`build_${type}`](i));
    } catch (cause) {
      throw new MockError("MOCK_GENERATION_FAILED", { details: { type, reason: cause.message } });
    }
  }

  build_users(i) {
    const first_name = pick(FIRST);
    const last_name = pick(LAST);
    return {
      first_name,
      last_name,
      email: `${first_name}.${last_name}.${i}@mock.shipnow.com`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""),
      role: pick(["user", "user", "user", "organizer"])
    };
  }

  build_events(i) {
    const date = new Date(Date.now() + (1 + Math.floor(Math.random() * 365)) * 86400000);
    return {
      title: `Evento mock #${i + 1}`,
      description: "Evento generado automáticamente para pruebas",
      category: pick(CATEGORIES),
      date,
      location: pick(CITIES),
      capacity: 10 + Math.floor(Math.random() * 490),
      price: Math.floor(Math.random() * 20000) / 100 * 10,
      status: pick(["draft", "published"])
    };
  }

  generateOne(type, quantityRaw, opts) {
    return this.safeGenerate(type, this.parseQuantity(quantityRaw), opts);
  }

  // POST body: { users?: n, events?: n }
  generateMany(body, opts) {
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      throw new ValidationError("MOCK_INVALID_PAYLOAD");
    }

    const unknown = Object.keys(body).filter(k => !MOCK_TYPES.includes(k));
    const requested = MOCK_TYPES.filter(t => body[t] !== undefined);

    if (unknown.length || requested.length === 0) {
      throw new ValidationError("MOCK_INVALID_PAYLOAD", { details: { unknownFields: unknown, allowed: MOCK_TYPES } });
    }

    // Se valida TODO antes de generar nada.
    const sizes = Object.fromEntries(requested.map(t => [t, this.parseQuantity(body[t], { field: t })]));
    return Object.fromEntries(requested.map(t => [t, this.safeGenerate(t, sizes[t], opts)]));
  }
}
