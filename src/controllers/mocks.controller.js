import { MocksService } from "../services/mocks.service.js";

const mocksService = new MocksService();

// forceError solo existe fuera de producción: sirve para probar la falla de generación.
const opts = (req) => ({
  forceError: process.env.NODE_ENV !== "production" && req.query.forceError === "true"
});

const single = (type) => (req, res, next) => {
  try {
    const data = mocksService.generateOne(type, req.query.quantity, opts(req));
    res.json({ status: "success", total: data.length, data });
  } catch (error) {
    next(error);
  }
};

export const getMockUsers = single("users");
export const getMockEvents = single("events");

export const generateData = (req, res, next) => {
  try {
    const data = mocksService.generateMany(req.body, opts(req));
    res.status(201).json({ status: "success", data });
  } catch (error) {
    next(error);
  }
};
