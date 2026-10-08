import mongoose from "mongoose";
import { eventDTO } from "../dto/event.dto.js";
import { EventRepository } from "../repositories/event.repository.js";
import { ValidationError, NotFoundError, AuthorizationError } from "../errors/index.js";

const VALID_STATUSES = ["draft", "published", "cancelled", "finished"];

export class EventService {
  constructor() {
    this.eventRepository = new EventRepository();
  }

  validateObjectId(id) {
    if (!mongoose.isValidObjectId(id)) {
      throw new ValidationError("INVALID_ID", { details: { field: "id", value: String(id) } });
    }
  }

  validateCapacityAndPrice(data) {
    if (data.capacity !== undefined && (!Number.isInteger(Number(data.capacity)) || Number(data.capacity) <= 0)) {
      throw new ValidationError("INVALID_CAPACITY", { details: { value: data.capacity } });
    }

    if (data.price !== undefined && (Number.isNaN(Number(data.price)) || Number(data.price) < 0)) {
      throw new ValidationError("INVALID_PRICE", { details: { value: data.price } });
    }
  }

  validateStatus(status) {
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      throw new ValidationError("INVALID_STATUS", {
        details: { received: status, allowed: VALID_STATUSES }
      });
    }
  }

  async createEvent(data, user) {
    const {
      title,
      description,
      category,
      date,
      location,
      capacity,
      price,
      status = "draft"
    } = data;

    const required = { title, description, category, date, location, capacity };
    const missing = Object.keys(required).filter(k => required[k] === undefined || required[k] === null || required[k] === "");
    if (missing.length) {
      throw new ValidationError("MISSING_FIELDS", { details: { missing } });
    }

    const eventDate = new Date(date);

    if (Number.isNaN(eventDate.getTime())) {
      throw new ValidationError("INVALID_DATE", { details: { field: "date", value: date } });
    }

    if (eventDate <= new Date()) {
      throw new ValidationError("PAST_DATE");
    }

    this.validateCapacityAndPrice({ capacity, price });
    this.validateStatus(status);

    const event = await this.eventRepository.create({
  title,
  description,
  category,
  date: eventDate,
  location,
  capacity,
  price,
  status,
  organizer: user._id
});

return eventDTO(event);
  }

  async getEventById(id) {
    this.validateObjectId(id);

    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new NotFoundError("EVENT_NOT_FOUND", { details: { id } });
    }

    return eventDTO(event);
  }

  async getEvents(query) {
    const {
      status,
      category,
      location,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
      sort = "date"
    } = query;

    this.validateStatus(status);

    const currentPage = Math.max(Number(page) || 1, 1);
    const currentLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = { $regex: category, $options: "i" };
    if (location) filter.location = { $regex: location, $options: "i" };

    if (dateFrom || dateTo) {
      filter.date = {};

      if (dateFrom) {
        const from = new Date(dateFrom);
        if (Number.isNaN(from.getTime())) {
          throw new ValidationError("INVALID_DATE", { details: { field: "dateFrom", value: dateFrom } });
        }
        filter.date.$gte = from;
      }

      if (dateTo) {
        const to = new Date(dateTo);
        if (Number.isNaN(to.getTime())) {
          throw new ValidationError("INVALID_DATE", { details: { field: "dateTo", value: dateTo } });
        }
        filter.date.$lte = to;
      }
    }

    const allowedSortFields = ["date", "price", "title", "category", "location"];
    const sortField = String(sort).startsWith("-") ? String(sort).slice(1) : sort;

    if (!allowedSortFields.includes(sortField)) {
      throw new ValidationError("INVALID_QUERY_PARAM", {
        details: { param: "sort", received: sort, allowed: allowedSortFields }
      });
    }

    const sortObject = {
      [sortField]: String(sort).startsWith("-") ? -1 : 1
    };

    const skip = (currentPage - 1) * currentLimit;

    const [data, total] = await Promise.all([
      this.eventRepository.findAll(filter, {
        skip,
        limit: currentLimit,
        sort: sortObject
      }),
      this.eventRepository.count(filter)
    ]);

    return {
       data: data.map(eventDTO),
       page: currentPage,
       limit: currentLimit,
       total,
       totalPages: Math.ceil(total / currentLimit)
    };
  }

  async findRawOrFail(id) {
    this.validateObjectId(id);
    const event = await this.eventRepository.findById(id);
    if (!event) throw new NotFoundError("EVENT_NOT_FOUND", { details: { id } });
    return event;
  }

  async assertCanManage(event, user) {
    const isAdmin = user.role === "admin";

    if (isAdmin) return;

    const organizerId = event.organizer?._id ?? event.organizer;
    const isOwner = organizerId.toString() === user._id.toString();

    if (!isOwner) {
      throw new AuthorizationError("FORBIDDEN", {
        message: "No tenés permisos para modificar este evento"
      });
    }
  }

  async updateEvent(id, data, user) {
    const event = await this.findRawOrFail(id);

    if (event.status === "cancelled") {
      throw new ValidationError("INVALID_STATE_CHANGE", { message: "Un evento cancelado no puede modificarse" });
    }

    await this.assertCanManage(event, user);

    const allowedFields = [
      "title",
      "description",
      "category",
      "date",
      "location",
      "capacity",
      "price"
    ];

    const updateData = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    if (updateData.date !== undefined) {
      const newDate = new Date(updateData.date);

      if (Number.isNaN(newDate.getTime())) {
        throw new ValidationError("INVALID_DATE", { details: { field: "date", value: updateData.date } });
      }

      if (newDate <= new Date()) {
        throw new ValidationError("PAST_DATE");
      }

      updateData.date = newDate;
    }

    this.validateCapacityAndPrice(updateData);

    if (Object.keys(updateData).length === 0) {
      throw new ValidationError("NO_FIELDS_TO_UPDATE", { details: { allowed: allowedFields } });
    }

    const updatedEvent = await this.eventRepository.updateById(
    id,
    updateData
);

return eventDTO(updatedEvent);  }

  async changeStatus(id, status, user) {
    if (!status) {
      throw new ValidationError("MISSING_FIELDS", { details: { missing: ["status"] } });
    }

    const event = await this.findRawOrFail(id);

    if (event.status === "cancelled") {
      throw new ValidationError("INVALID_STATE_CHANGE", { message: "Un evento cancelado no puede cambiar de estado" });
    }

    await this.assertCanManage(event, user);

    this.validateStatus(status);

    if (status === "published" && event.status === "finished") {
      throw new ValidationError("INVALID_STATE_CHANGE", { message: "No se puede publicar un evento finalizado" });
    }

    if (event.status === status) {
      throw new ValidationError("INVALID_STATE_CHANGE", { message: `El evento ya tiene status "${status}"` });
    }

  const updatedEvent = await this.eventRepository.updateById(
  id,
  { status }
);

return eventDTO(updatedEvent);  }
}