import mongoose from "mongoose";
import { generateTicketCode } from "../utils/ticketcode.js";
import { TicketRepository } from "../repositories/ticket.repository.js";
import { EventRepository } from "../repositories/event.repository.js";
import { ValidationError, NotFoundError, AuthorizationError, ConflictError } from "../errors/index.js";

export class TicketService {

  constructor() {
    this.ticketRepository = new TicketRepository();
    this.eventRepository = new EventRepository();
  }

  validateObjectId(id, field = "id") {
    if (!mongoose.isValidObjectId(id)) {
      throw new ValidationError("INVALID_ID", { details: { field, value: String(id) } });
    }
  }

  // CREAR TICKET
  async createTicket(eventId, userId, quantity) {

    this.validateObjectId(eventId, "eventId");
    this.validateObjectId(userId, "userId");

    // Validar cantidad
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ValidationError("INVALID_QUANTITY", { details: { value: quantity } });
    }

    // Buscar evento mediante Repository
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new NotFoundError("EVENT_NOT_FOUND", { details: { id: eventId } });
    }

    // Validar estado del evento
    if (event.status !== "published") {
      throw new ValidationError("EVENT_NOT_PUBLISHED");
    }

    // Buscar tickets activos del evento
    const activeTickets = await this.ticketRepository.find({
      event: eventId,
      status: "active"
    });

    // Calcular cupos ocupados
    const occupied = activeTickets.reduce(
      (total, ticket) => total + ticket.quantity,
      0
    );

    // Calcular cupos disponibles
    const available = event.capacity - occupied;

    if (available < quantity) {
      throw new ConflictError("INSUFFICIENT_CAPACITY", { details: { available, requested: quantity } });
    }

    // Verificar si el usuario ya tiene un ticket activo
    const existingTicket = await this.ticketRepository.findOne({
      user: userId,
      event: eventId,
      status: "active"
    });

    if (existingTicket) {
      throw new ConflictError("DUPLICATE_TICKET");
    }

    // Crear ticket
    const ticket = await this.ticketRepository.create({
      user: userId,
      event: eventId,
      quantity,
      status: "active",
      code: generateTicketCode()
    });

    return ticket;
  }


  // CANCELAR TICKET
  async cancelTicket(ticketId, userId, userRole) {

    this.validateObjectId(ticketId, "ticketId");
    this.validateObjectId(userId, "userId");

    const ticket = await this.ticketRepository.findById(ticketId);

    if (!ticket) {
      throw new NotFoundError("TICKET_NOT_FOUND", { details: { id: ticketId } });
    }

    // Verificar si ya está cancelado
    if (ticket.status === "cancelled") {
      throw new ValidationError("TICKET_ALREADY_CANCELLED");
    }

    // Verificar propietario
    const isOwner =
      ticket.user.toString() === userId.toString();

    const isAdmin = userRole === "admin";

    if (!isOwner && !isAdmin) {
      throw new AuthorizationError("FORBIDDEN", { message: "No tenés permisos para cancelar este ticket" });
    }

    // Cancelar ticket
    const updatedTicket = await this.ticketRepository.updateById(
      ticketId,
      {
        status: "cancelled",
        cancelledAt: new Date()
      }
    );

    return updatedTicket;
  }


  // OBTENER MIS TICKETS
  async getMyTickets(userId) {

    this.validateObjectId(userId, "userId");

    const tickets = await this.ticketRepository.find({ user: userId });

    return tickets;
  }


  // OBTENER TICKETS DE UN EVENTO
  async getEventTickets(eventId, userId, userRole) {

    this.validateObjectId(eventId, "eventId");
    this.validateObjectId(userId, "userId");

    // Buscar evento
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new NotFoundError("EVENT_NOT_FOUND", { details: { id: eventId } });
    }

    // Verificar permisos
    const isAdmin = userRole === "admin";

    const isOrganizer =
      userRole === "organizer" &&
      (event.organizer?._id ?? event.organizer).toString() === userId.toString();

    if (!isAdmin && !isOrganizer) {
      throw new AuthorizationError("FORBIDDEN", { message: "No tenés permisos para consultar los tickets de este evento" });
    }

    // Obtener tickets
    const tickets =
      await this.ticketRepository.find({ event: eventId });

    return tickets;
  }
}