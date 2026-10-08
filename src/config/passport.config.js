import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import userRepository from "../repositories/users.repository.js";

const cookieExtractor = (req) => req?.cookies?.currentUser ?? null;

// Se registran al importar el archivo, así que JWT_SECRET debe estar cargado antes (dotenv).
const secretOrKey = process.env.JWT_SECRET;
if (!secretOrKey) throw new Error("Falta JWT_SECRET en el archivo .env");

const verify = async (payload, done) => {
  try {
    const user = await userRepository.getById(payload.id);
    return done(null, user || false);
  } catch (error) {
    return done(error, false);
  }
};

passport.use("jwt", new JwtStrategy({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), secretOrKey }, verify));
passport.use("current", new JwtStrategy({ jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]), secretOrKey }, verify));

export default passport;
