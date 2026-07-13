# API

API contract and endpoint specifications for Aidnara AI.

## Responsibility

- Define request and response shapes.
- Document route behavior.
- Keep AI, certificate, storage, and verification API contracts stable.

## MVP Endpoints

- `POST /api/ai/impact-report`
- `POST /api/certificates/generate`
- `GET /api/certificates/[hash]`
- `POST /api/storage/signed-upload`

## Rule

API specs live here. Runtime server code can live in `be/` or inside the frontend framework when using Next.js route handlers.
