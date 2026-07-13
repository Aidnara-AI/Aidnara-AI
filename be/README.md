# BE

Backend services for Aidnara AI.

## Responsibility

- Supabase database access.
- Server-side ownership validation.
- Storage upload orchestration.
- AI impact report persistence.
- Certificate generation persistence.
- Event indexing/cache jobs if needed.

## Suggested Stack

- Next.js route handlers or Node.js service
- Supabase Postgres
- Supabase Storage

## Server-Only Rules

- Keep service role keys here only.
- Never expose AI keys to frontend.
- Validate wallet ownership before proof or certificate writes.
