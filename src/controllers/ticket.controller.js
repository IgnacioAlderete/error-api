import { TicketService } from "../services/ticket.service.js";
import { ticketDTO } from "../dto/ticket.dto.js";

const ticketService = new TicketService();

export const createTicket = async (req, res, next) => {
  try {
    const { eventId, quantity = 1 } = req.body ?? {};
    const ticket = await ticketService.createTicket(eventId, req.user.id, quantity);

    res.status(201).json({ status: "success", data: ticketDTO(ticket) });
  } catch (error) {
    next(error);
  }
};

export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await ticketService.getMyTickets(req.user.id);
    res.json({ status: "success", data: tickets.map(ticketDTO) });
  } catch (error) {
    next(error);
  }
};

export const getEventTickets = async (req, res, next) => {
  try {
    const tickets = await ticketService.getEventTickets(req.params.eid, req.user.id, req.user.role);
    res.json({ status: "success", data: tickets.map(ticketDTO) });
  } catch (error) {
    next(error);
  }
};

export const cancelTicket = async (req, res, next) => {
  try {
    const ticket = await ticketService.cancelTicket(req.params.tid, req.user.id, req.user.role);
    res.json({ status: "success", data: ticketDTO(ticket) });
  } catch (error) {
    next(error);
  }
};
