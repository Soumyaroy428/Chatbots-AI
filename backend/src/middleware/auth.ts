import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../lib/errors.js";

export type AuthUser = {
  id: string;
  email: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError("Authentication required", 401));
  }

  const token = header.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return next(new AppError("Server misconfigured", 500));
  }

  try {
    const payload = jwt.verify(token, secret) as AuthUser;
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch {
    next(new AppError("Invalid or expired token", 401));
  }
}
