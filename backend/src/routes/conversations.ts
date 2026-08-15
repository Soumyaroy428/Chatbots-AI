import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError, asyncHandler } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";

export const conversationsRouter = Router();

conversationsRouter.use(requireAuth);

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

conversationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const conversations = await prisma.conversation.findMany({
      where: {
        userId: req.user!.id,
        ...(q
          ? {
              OR: [
                { title: { contains: q } },
                { messages: { some: { content: { contains: q } } } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        model: true,
        favorited: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ conversations });
  })
);

conversationsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = paramId(req.params.id);
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: req.user!.id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!conversation) throw new AppError("Conversation not found", 404);
    res.json({ conversation });
  })
);

const patchSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  favorited: z.boolean().optional(),
});

conversationsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = paramId(req.params.id);
    const body = patchSchema.parse(req.body);
    const existing = await prisma.conversation.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!existing) throw new AppError("Conversation not found", 404);

    const conversation = await prisma.conversation.update({
      where: { id: existing.id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.favorited !== undefined ? { favorited: body.favorited } : {}),
      },
    });
    res.json({ conversation });
  })
);

conversationsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = paramId(req.params.id);
    const existing = await prisma.conversation.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!existing) throw new AppError("Conversation not found", 404);
    // MongoDB has no FK cascade — delete messages first
    await prisma.message.deleteMany({ where: { conversationId: existing.id } });
    await prisma.conversation.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  })
);
