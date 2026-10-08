import userRepository from "../repositories/users.repository.js";


class UserDAO {


 async getUserByEmail(email) {
    return await userRepository.getByEmail(email);
  }

  async getUserById(id) {
    return await userRepository.getById(id);
  }

  async createUser(userData) {
    return await userRepository.create(userData);
  }


}

export default new UserDAO();