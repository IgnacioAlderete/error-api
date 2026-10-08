import Ticket from "../models/model.ticket.js";

export class TicketDAO {

  async create(data) {
    return await Ticket.create(data);
  }

  async findById(id) {
    return await Ticket.findById(id);
  }

  async findOne(filter) {
    return await Ticket.findOne(filter);
  }

  async find(filter) {
    return await Ticket.find(filter);
  }

  async count(filter) {
    return await Ticket.countDocuments(filter);
  }

  async updateById(id, data) {
    return await Ticket.findByIdAndUpdate(
      id,
      data,
      {
        new: true,
        runValidators: true
      }
    );
  }

}