import jwt from "jsonwebtoken";
import { X_HEADER_USER_ID } from "./constant";

const JWT_SECRET = process.env.JWT_SECRET;

export function verifyJWT(request) {
  const token = request.cookies.get("token")?.value;

  if (!token || !JWT_SECRET) return null;

  try {
    return jwt.verify(token, JWT_SECRET);
  }
  catch {
    return null;
  }
}

// checks the user id header that the proxy set from the token, the admin user has the id -1
export function isAdmin(request) {
  const headers = request.headers;
  const userId = Number(headers.get(X_HEADER_USER_ID));
  return userId == -1;
}
