import { getUser } from "../services/auth.services.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  const user = getUser(token);

  if (!user) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }

  req.user = user;
  next();
}
