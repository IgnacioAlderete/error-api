import userRepository from "../repositories/users.repository.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import { ValidationError, AuthenticationError, ConflictError } from "../errors/index.js";

export class AuthService {
  async register(data = {}) {
    const email = data.email?.trim().toLowerCase();
    const required = { first_name: data.first_name, last_name: data.last_name, email, password: data.password };
    const missing = Object.keys(required).filter(k => !required[k]);

    if (missing.length) {
      throw new ValidationError("MISSING_FIELDS", { details: { missing } });
    }

    if (typeof data.password !== "string" || data.password.length < 8) {
      throw new ValidationError("WEAK_PASSWORD");
    }

    if (await userRepository.getByEmail(email)) {
      throw new ConflictError("EMAIL_ALREADY_EXISTS");
    }

    const password = await hashPassword(data.password);

    // El rol NO se toma del body: evita que cualquiera se registre como admin.
    return userRepository.create({
      first_name: data.first_name,
      last_name: data.last_name,
      email,
      password,
      role: "user"
    });
  }

  async login(email, password) {
    if (!email || !password) {
      throw new ValidationError("MISSING_FIELDS", {
        details: { missing: [!email && "email", !password && "password"].filter(Boolean) }
      });
    }

    const user = await userRepository.getByEmail(String(email).trim().toLowerCase());

    // Mismo error para "no existe" y "clave incorrecta": no revela qué emails existen.
    if (!user || !(await comparePassword(password, user.password))) {
      throw new AuthenticationError("INVALID_CREDENTIALS");
    }

    return {
      user: { id: user._id, email: user.email, role: user.role },
      token: generateToken({ id: user.id, email: user.email, role: user.role })
    };
  }
}

export default AuthService;
