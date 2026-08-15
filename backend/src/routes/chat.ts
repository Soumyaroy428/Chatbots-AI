import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError, asyncHandler } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";
import { getDefaultModel, streamChatCompletion, titleFromMessage } from "../services/ai.js";

export const chatRouter = Router();

chatRouter.use(requireAuth);

const chatSchema = z.object({
  message: z.string().trim().min(1).max(12000),
  conversationId: z.string().optional(),
});

chatRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = chatSchema.parse(req.body);
    const userId = req.user!.id;
    const model = getDefaultModel();

    let conversation = body.conversationId
      ? await prisma.conversation.findFirst({
          where: { id: body.conversationId, userId },
          include: { messages: { orderBy: { createdAt: "asc" }, take: 40 } },
        })
      : null;

    if (body.conversationId && !conversation) {
      throw new AppError("Conversation not found", 404);
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId,
          title: titleFromMessage(body.message),
          model,
          messages: {
            create: { role: "user", content: body.message },
          },
        },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
    } else {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "user",
          content: body.message,
        },
      });
      if (conversation.title === "New chat") {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { title: titleFromMessage(body.message) },
        });
      }
      conversation = await prisma.conversation.findFirstOrThrow({
        where: { id: conversation.id },
        include: { messages: { orderBy: { createdAt: "asc" }, take: 40 } },
      });
    }

    const history = conversation.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    res.write(
      `data: ${JSON.stringify({
        type: "meta",
        conversationId: conversation.id,
        title: conversation.title === "New chat" ? titleFromMessage(body.message) : conversation.title,
      })}\n\n`
    );

    let full = "";
    try {
      for await (const chunk of streamChatCompletion(history)) {
        full += chunk;
        res.write(`data: ${JSON.stringify({ type: "delta", content: chunk })}\n\n`);
      }

      const assistantMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "assistant",
          content: full || "Sorry, I couldn't generate a response. Please try again.",
        },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      res.write(
        `data: ${JSON.stringify({
          type: "done",
          messageId: assistantMessage.id,
          conversationId: conversation.id,
        })}\n\n`
      );
      res.end();
    } catch (err) {
      console.error(err);
      const raw = err instanceof Error ? err.message : "Unknown AI error";
      const fallback = raw.includes("not found")
        ? "Ollama model is not ready yet. Wait for the model download to finish (`ollama pull`), then try again."
        : raw.includes("ECONNREFUSED") || raw.includes("fetch failed")
          ? "Cannot reach Ollama. Make sure Ollama is running (ollama serve), then try again."
          : "Sorry, I couldn't generate a response. Please try again.";
      const assistantMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "assistant",
          content: fallback,
        },
      });
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          content: fallback,
          messageId: assistantMessage.id,
          conversationId: conversation.id,
        })}\n\n`
      );
      res.end();
    }
  })
);
