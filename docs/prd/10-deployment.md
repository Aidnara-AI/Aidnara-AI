# PRD 10 - Deployment

## Deployment Goal

Deploy a stable public demo where judges can open the app, inspect campaign transparency, and verify certificates without local setup.

## Environments

- Local development: developer testing.
- Vercel preview: full demo rehearsal.
- Vercel production: final competition URL.

## Required Services

- Vercel for app hosting.
- Supabase for database and storage.
- BNB Smart Chain Testnet for smart contract.
- Gemini/OpenAI for AI vision analysis.
- Block explorer for public transaction links.

## Deployment Units

- `fe/`: deployed to Vercel as the public web app.
- `be/`: deployed as Vercel server routes, serverless functions, or a separate Node service if needed.
- `api/`: documentation/spec source, not deployed as runtime by default.
- `blockchain/`: deployed to selected testnet before frontend production demo.

## Required Environment Variables

```text
NEXT_PUBLIC_CHAIN_ID=
NEXT_PUBLIC_RPC_URL=
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AI_API_KEY=
PINATA_JWT=
```

## Deployment Steps

1. Deploy `blockchain/` smart contract to BNB Smart Chain Testnet.
2. Verify contract address and explorer URL.
3. Save contract address, ABI, and chain ID for `fe/` and `be/`.
4. Create Supabase tables.
5. Create Supabase Storage buckets for campaign covers, proofs, and certificates.
6. Configure RLS or server-only writes for `be/`.
7. Configure environment variables in Vercel.
8. Run `node scripts/verify-mvp.js`.
9. Deploy `fe/` app to Vercel preview with backend routes enabled.
10. Run full manual demo flow on preview URL.
11. Fix preview issues.
12. Promote to production.
13. Run smoke test on production URL.

## Production Smoke Test

- Landing page loads.
- Campaign list loads.
- Campaign detail loads.
- Wallet connect opens.
- Verification page works for known certificate hash.
- Invalid certificate hash shows `NOT FOUND`.
- No secret values are visible in client source or logs.

## Pre-Demo Checklist

- Testnet wallet has enough faucet funds.
- Contract address points to BNB Smart Chain Testnet.
- AI API key works.
- Storage upload works.
- Explorer links open correctly.
- Certificate QR opens verification page.
- Demo campaign data is prepared.
- Backup screenshots are prepared in case testnet RPC is slow.
- No secrets are committed.

## Rollback Plan

- Keep previous Vercel deployment available.
- Keep demo campaign id and certificate hash documented.
- If AI provider fails, show last generated AI report from database.
- If RPC is slow, show explorer transaction links and cached dashboard data.

## Post-Demo Improvements

- Add NFT certificate.
- Add stablecoin donations.
- Add organizer profile and reputation.
- Add stricter proof review workflow.
- Add batch certificates.
