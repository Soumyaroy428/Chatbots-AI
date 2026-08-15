import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth.js";
import { chatRouter } from "./routes/chat.js";
import { conversationsRouter } from "./routes/conversations.js";
import { userRouter } from "./routes/user.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        if (/\.vercel\.app$/i.test(origin)) return callback(null, true);
        return callback(null, false);
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.use(
    "/api/",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "chatbots-ai" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/conversations", conversationsRouter);
  app.use("/api/user", userRouter);

  app.use(errorHandler);
  return app;
}

const app = createApp();
export default app;
