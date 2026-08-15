import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError, asyncHandler } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";

export const userRouter = Router();

userRouter.use(requireAuth);

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});

userRouter.get(
  "/profile",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new AppError("User not found", 404);
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        theme: user.theme,
        createdAt: user.createdAt,
      },
    });
  })
);

userRouter.patch(
  "/profile",
  asyncHandler(async (req, res) => {
    const body = profileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.theme !== undefined ? { theme: body.theme } : {}),
      },
    });
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        theme: user.theme,
        createdAt: user.createdAt,
      },
    });
  })
);
