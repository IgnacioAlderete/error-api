export const ticketDTO = (ticket) => ({
  id: ticket._id,
  code: ticket.code,
  status: ticket.status,
  quantity: ticket.quantity,
  cancelledAt: ticket.cancelledAt,
  createdAt: ticket.createdAt,

  event: ticket.event
    ? {
        id: ticket.event._id,
        title: ticket.event.title,
        date: ticket.event.date,
        location: ticket.event.location
      }
    : null
});