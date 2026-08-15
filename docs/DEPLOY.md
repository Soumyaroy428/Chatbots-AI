# Deploy to Vercel

This repo deploys as **one Vercel project**:
- Vite frontend → static site
- Express API → `/api` serverless function
- MongoDB Atlas → database
- **OpenAI** (or any OpenAI-compatible cloud API) for production AI

> Ollama is for local development only. Vercel cannot reach your laptop’s Ollama.

## 1. Push the project to GitHub

Create a GitHub repo and push this folder.

## 2. Import in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the GitHub repo
3. Framework Preset: **Other**
4. Leave Root Directory as `.` (repo root)
5. Vercel will read `vercel.json`

## 3. Add Environment Variables

In Vercel → Project → Settings → Environment Variables, add:

| Name | Example / notes |
|------|------------------|
| `DATABASE_URL` | `mongodb+srv://USER:PASS@cluster.../chatbots-ai?retryWrites=true&w=majority` |
| `JWT_SECRET` | long random string |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | your Vercel URL, e.g. `https://chatbots-ai.vercel.app` (update after first deploy) |
| `AI_PROVIDER` | `openai` |
| `OPENAI_API_KEY` | your OpenAI key |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` (optional) |
| `OPENAI_MODEL` | `gpt-4o-mini` (optional) |

After the first deploy, set `CLIENT_URL` to the real `https://….vercel.app` URL and redeploy.

## 4. Deploy

Click **Deploy**. When it finishes, open the site URL, register, and chat.

## 5. Local vs Production AI

| Environment | AI |
|-------------|-----|
| Local (`npm run dev`) | Ollama (`llama3.2`) |
| Vercel | OpenAI (`AI_PROVIDER=openai`) |

## Notes

- Hobby plan serverless timeout is short; long answers may need a Pro plan (`maxDuration` is set to 60s).
- Keep secrets only in Vercel env / local `.env` — never commit them.
- If chat fails on Vercel, check Function logs for missing `OPENAI_API_KEY` or `DATABASE_URL`.
- In MongoDB Atlas → Network Access, allow `0.0.0.0/0` (or Vercel IPs) so serverless functions can connect.
