import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
configDotenv();
const secret = process.env.JWT_SECRET;

export function setUser(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.fullname,
      email: user.email,
    },
    secret,
  );
}

export function getUser(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}
