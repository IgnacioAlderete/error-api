import bcrypt from "bcrypt"


//export const createHash = async password => {
  //return await bcrypt.hash(password, 10)
//}



//export const isValidPassword = (password, hashedPassword) => {
 // return  bcrypt.compareSync(password, hashedPassword)
//}

export const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};