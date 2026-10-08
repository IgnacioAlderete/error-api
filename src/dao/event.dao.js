import Event from "../models/model.event.js";

export class EventDAO {

  async create(data) {
    return await Event.create(data);
  }

  async findById(id) {
    return await Event.findById(id)
      .populate("organizer", "first_name last_name email role");
  }

  async updateById(id, data) {
    return await Event.findByIdAndUpdate(
      id,
      data,
      {
        new: true,
        runValidators: true
      }
    ).populate("organizer", "first_name last_name email role");
  }

  async findAll(filter, { skip, limit, sort }) {
    return await Event.find(filter)
      .populate("organizer", "first_name last_name email role")
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  async count(filter) {
    return await Event.countDocuments(filter);
  }
}