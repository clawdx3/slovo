# VPS deployment

## Files
- `docker-compose.vps.yml` – Slovo compose stack for VPS
- `.env.vps.example` – environment template (copy to `.env.vps` on server)

## Run on VPS
```bash
cd /opt/apps/slovo/deploy
docker compose -p slovo -f docker-compose.vps.yml --env-file .env.vps up -d --build --force-recreate
```

## Notes
- Uses `vps-app-stack_internal` external network for shared services.
- Image is explicitly named (`slovo`) to avoid collisions with other stacks.
- Redis runs on the shared VPS network (`vps-redis`).
