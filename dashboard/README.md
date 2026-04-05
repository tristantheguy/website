# Lyra Task Dashboard

## Page path
- Static page: `/dashboard/`

## API path
- Read-only JSON endpoint: `https://tasks.tristans-website.com/api/lyra-tasks`

## How it works
- The static dashboard page polls the VPS API every 20 seconds.
- The API reads durable task state from:
  - `/root/.openclaw/workspace/memory/tasks/`
  - `/root/.openclaw/workspace/state/runner_last_result.json`
  - `/root/.openclaw/workspace/workers/iris/selected_task.json`
- The API returns a normalized JSON summary instead of exposing raw task files directly.

## API service
- Source: `task-dashboard-api/server.mjs`
- Default bind: `127.0.0.1:4388`

## Deploy note
- The public API should now be exposed from the VPS through Caddy at `https://tasks.tristans-website.com/api/lyra-tasks` and reverse proxied to `127.0.0.1:4388`.
- The dashboard page fetches that public API origin directly every 20 seconds.
