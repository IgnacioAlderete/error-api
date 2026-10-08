import crypto from "crypto";

export const generateTicketCode = () =>
  `TKT-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
