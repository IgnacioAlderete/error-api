import passport from "passport";
import { AuthenticationError, AuthorizationError } from "../errors/index.js";

// Autenticación con JWT: los fallos van al middleware global (no se responde acá).
export const authenticateJWT = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) return next(new AuthenticationError());
    req.user = user;
    next();
  })(req, res, next);
};

export const authenticateCurrent = (req, res, next) => {
  passport.authenticate("current", { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) return next(new AuthenticationError());
    req.user = user;
    next();
  })(req, res, next);
};

export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next(new AuthenticationError());
  if (!allowedRoles.includes(req.user.role)) {
    return next(new AuthorizationError("FORBIDDEN", {
      details: { requiredRoles: allowedRoles, yourRole: req.user.role }
    }));
  }
  next();
};
