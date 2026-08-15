import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError, asyncHandler } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(100),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

function signToken(user: { id: string; email: string }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError("Server misconfigured", 500);
  return jwt.sign({ id: user.id, email: user.email }, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"],
  });
}

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  theme: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profileImage: user.profileImage,
    theme: user.theme,
    createdAt: user.createdAt,
  };
}

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (existing) throw new AppError("Email already registered", 409);

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        passwordHash,
      },
    });

    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!user) throw new AppError("Invalid email or password", 401);

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new AppError("Invalid email or password", 401);

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  })
);

authRouter.post("/logout", requireAuth, (_req, res) => {
  res.json({ ok: true });
});

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new AppError("User not found", 404);
    res.json({ user: publicUser(user) });
  })
);
