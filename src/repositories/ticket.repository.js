import { TicketDAO } from "../dao/ticket.dao.js";

export class TicketRepository {

  constructor() {
    this.dao = new TicketDAO();
  }

  create(data) {
    return this.dao.create(data);
  }

  findById(id) {
    return this.dao.findById(id);
  }

  findOne(filter) {
    return this.dao.findOne(filter);
  }

  find(filter) {
    return this.dao.find(filter);
  }

  count(filter) {
    return this.dao.count(filter);
  }

  updateById(id, data) {
    return this.dao.updateById(id, data);
  }

}