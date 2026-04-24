# Slovo

Video transcription, editing, and translation tool for Slovenian content creators.

Upload video → transcribe (Whisper) → edit → translate → export SRT for Adobe Premiere.

- **Linear:** PRD-56
- **GitHub:** (repo TBD)
- **Deploy:** sugaro-vps

## Stack

- Nuxt 3 (fullstack — no separate backend)
- Nitro server routes for API
- Groq Whisper API for transcription
- Google Translate API for translation (or free alternative)
- BullMQ for background jobs (if needed for long transcriptions)
- Modern minimalist design

## Roadmap

1. Initial build (PRD-56)
2. Polish & iterate
