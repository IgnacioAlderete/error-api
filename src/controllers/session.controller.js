import { AuthService } from "../services/auth.service.js";
import { UserDTO } from "../dto/user.dto.js";

const authService = new AuthService();

export const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);

    res.status(201).json({
      status: "success",
      message: "Usuario registrado",
      data: new UserDTO(user)
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { user, token } = await authService.login(req.body?.email, req.body?.password);

    res.cookie("currentUser", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000
    });

    res.status(200).json({ status: "success", message: "Login correcto", data: { user, token } });
  } catch (error) {
    next(error);
  }
};

export const current = (req, res, next) => {
  try {
    res.status(200).json({ status: "success", data: new UserDTO(req.user) });
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
  res.clearCookie("currentUser");
  res.status(200).json({ status: "success", message: "Logout exitoso" });
};
