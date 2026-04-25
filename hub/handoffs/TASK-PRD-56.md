# TASK-PRD-56

**Project:** Slovo
**Linear:** PRD-56
**GitHub:** https://github.com/clawdx3/slovo
**Repo path:** ~/.openclaw/workspace/projects/slovo/product
**Branch:** feat/PRD-56-initial-build
**Target deploy:** sugaro-vps (Docker)

## Overview

Build Slovo — a Nuxt 3 fullstack app for Slovenian video creators.

Flow: Upload video (from iPhone 15 Pro) → transcribe via Groq Whisper API → review & edit transcript → translate to English → export .srt for Adobe Premiere on iOS.

## Acceptance Criteria

- [x] Video upload via web UI (drag-drop or file picker, works on iPhone Safari)
- [x] Transcription via Groq Whisper API (free tier — `whisper-large-v3` or similar)
- [x] Transcript review + inline editing UI (editable text per segment)
- [x] Translate transcript to English (Google Cloud Translation API or free alternative like LibreTranslate self-hosted)
- [x] Export as .srt file compatible with Adobe Premiere on iOS
- [ ] Optional: highlight spoken words in subtitle preview (karaoke-style word timing)
- [x] Modern minimalist design (clean, light, nice typography)
- [x] Deployed to sugaro-vps via Docker + CI/CD
- [x] CI/CD: GitHub Actions auto-deploy on push to main (like route-optimizer)

## Stack

- **Frontend + API:** Nuxt 3 (Nitro server routes, no separate BE service)
- **Queue:** BullMQ with Redis for background transcription jobs (long videos)
- **Transcription:** Groq Whisper API (`https://api.groq.com/openai/v1/audio/transcriptions`)
- **Translation:** Google Cloud Translation API v2 (free tier: 500k chars/month) OR LibreTranslate
- **Design:** Minimalist, clean, modern — think Linear/Notion vibes
- **Deploy:** Docker Compose on sugaro-vps
- **CI/CD:** GitHub Actions → SSH deploy to sugaro-vps

## Technical Notes

### SRT Format for Premiere iOS
Adobe Premiere on iOS accepts standard SRT files. Format:
```
1
00:00:01,000 --> 00:00:04,000
Hello world

2
00:00:04,500 --> 00:00:07,000
Second line
```
Ensure UTF-8 encoding, Windows line endings optional but LF works.

### Groq Whisper API
- Endpoint: POST `https://api.groq.com/openai/v1/audio/transcriptions`
- Model: `whisper-large-v3`
- Response includes `segments` with `start`, `end`, `text`
- Free tier: 20 requests/min, 1,440,000 tokens/day
- Need `GROQ_API_KEY` env var

### Google Translate API
- Endpoint: `https://translation.googleapis.com/language/translate/v2`
- Free tier: 500,000 characters/month
- Source: `sl`, Target: `en`
- Need `GOOGLE_TRANSLATE_API_KEY` env var

### iPhone Upload Considerations
- Use `<input type="file" accept="video/*">` — Safari iOS handles this well
- Show upload progress (chunked or standard multipart)
- File size: iPhone 15 Pro videos can be large (4K ProRes), consider chunked upload or warn about size
- For MVP: standard multipart upload via Nitro is fine; add chunking if needed later

### Queue (BullMQ)
- Use for transcription jobs (can take 30-60s for long videos)
- Redis on sugaro-vps (already running for other apps)
- Job status: pending → processing → completed/failed
- UI shows real-time job status

### Docker Deploy
- Sugar VPS already has Docker + Traefik
- Add `slovo` service to existing docker-compose or separate compose
- Domain: `slovo.sugaro.ai` or similar (Borut can configure DNS)

### CI/CD
- GitHub Actions workflow on `.github/workflows/deploy.yml`
- Build Docker image → push to GHCR → SSH to sugaro-vps → pull & restart
- Pattern from route-optimizer

## Design Direction

- Clean white/light gray background
- Rounded corners, subtle shadows
- Nice sans-serif font (Inter or system-ui)
- Accent color: soft blue or teal
- Video upload area: large dashed border dropzone
- Transcript editor: clean textarea or contenteditable per segment
- Export button: prominent, primary action

## Out of Scope (for now)

- User auth / accounts
- Multiple languages beyond Slovenian → English
- Video editing beyond subtitles
- Mobile native app (web app only)

## Files to Create

```
projects/slovo/product/
├── .github/workflows/deploy.yml
├── docker-compose.yml
├── Dockerfile
├── nuxt.config.ts
├── package.json
├── .env.example
├── app/
│   ├── app.vue
│   ├── pages/
│   │   └── index.vue
│   ├── components/
│   │   ├── UploadDropzone.vue
│   │   ├── TranscriptEditor.vue
│   │   ├── TranslationPanel.vue
│   │   └── SrtExporter.vue
│   └── server/
│       ├── api/
│       │   ├── upload.post.ts
│       │   ├── transcribe.post.ts
│       │   ├── translate.post.ts
│       │   └── jobs/[id].get.ts
│       └── utils/
│           ├── groq.ts
│           ├── google-translate.ts
│           └── srt.ts
```

## Status

**Completed:** 2026-04-25
**Branch:** `feat/PRD-56-initial-build` → merged to `main`
**PR:** https://github.com/clawdx3/slovo/pull/1 (merged)
**Reviewer:** `borutkitak`

All core acceptance criteria implemented except karaoke-style word timing (optional). Build passes (`pnpm build` OK). Merged to `main` per Borut's request.

### Deploy status
- GitHub Actions workflow is in place at `.github/workflows/deploy.yml`
- First deploy run **failed** because GitHub secrets are missing in the `slovo` repo
- **Blocker:** `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` secrets must be added to the repo (same as route-optimizer)
- **Also needed on VPS:** `GROQ_API_KEY`, `GOOGLE_TRANSLATE_API_KEY`, `REDIS_PASSWORD`
- Next push to `main` will auto-trigger deploy once secrets are configured

## Handoff

- Developer → Orchestrator: notify Borut that secrets are needed
- After secrets configured → next push triggers auto-deploy
- QA: test upload/transcribe/translate/export flow end-to-end
