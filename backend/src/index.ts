import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth.js";
import { chatRouter } from "./routes/chat.js";
import { conversationsRouter } from "./routes/conversations.js";
import { userRouter } from "./routes/user.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const port = Number(process.env.PORT) || 4000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.use(helmet());
app.use(
  cors({
    origin: clientUrl,
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

app.listen(port, () => {
  console.log(`Chatbots AI API running on http://localhost:${port}`);
});
