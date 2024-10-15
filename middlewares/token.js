import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const key = process.env.KEY;

const generateToken = (id, username, type) => {
  const token = jwt.sign({ id, username, type }, key, { expiresIn: "30d" });
  return token;
};

export default generateToken;
