# Chatbots AI

AI-powered chat web application — React + Express + Prisma + OpenAI-compatible API.

## Quick start

1. **Install dependencies**

```bash
npm run setup
```

2. **Configure environment**

Copy `backend/.env.example` → `backend/.env` and set:

- `JWT_SECRET` — any long random string
- `DATABASE_URL` — your MongoDB Atlas URL
- Ollama is the default AI (`AI_PROVIDER=ollama`). Keep Ollama running and set `OLLAMA_MODEL` to a pulled model (this machine has `gpt-oss:latest`).

3. **Run**

```bash
npm run dev
```

- Frontend: http://localhost:5173  
- Backend: http://localhost:4000  

## Stack

| Layer | Tech |
|--------|------|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB Atlas via Prisma |
| Auth | JWT + bcrypt |
| AI | Ollama (local) — OpenAI-compatible API |

## Project structure

```
chatbots-ai/
├── frontend/     React app
├── backend/      Express API
├── docs/         PRD notes
└── README.md
```

## MVP features

- Landing, register, login, logout
- Chat with streaming AI responses
- Conversation history (create, open, delete, rename)
- User profile + dark/light/system theme
- Responsive layout

## Deploy to Vercel

See **[Chatbots AI](https://chatbots-ai-v2wi.vercel.app/)** for the deployed application.

Summary:
1. Push to GitHub → Import in Vercel  
2. Set env vars: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, `AI_PROVIDER=openai`, `OPENAI_API_KEY`  
3. Deploy  

Local AI uses **Ollama**. Production on Vercel uses **OpenAI** (Ollama is not available in the cloud).
