# Slovo

Slovenian video transcription app. Upload a video, get editable transcript, translate to English, export as .srt for Adobe Premiere on iOS.

## Stack
- Nuxt 3 (fullstack)
- Tailwind CSS
- Groq Whisper API (transcription)
- Google Cloud Translation API (translation)
- BullMQ + Redis (job queue — ready for future use)

## Dev

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
pnpm start
```

## Env

Copy `.env.example` to `.env` and fill in:
- `GROQ_API_KEY`
- `GOOGLE_TRANSLATE_API_KEY`
- `REDIS_URL` (optional for dev)

## Deploy

GitHub Actions auto-deploys on push to `main`.

```bash
cd deploy
docker compose -p slovo -f docker-compose.vps.yml --env-file .env.vps up -d
```
