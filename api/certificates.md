# Certificates API

## POST /api/certificates

Registers a new certificate record linking a campaign, a donation, and a proof.

### Request

```json
{
  "campaign_id": "uuid-string",
  "donation_id": "uuid-string",
  "proof_id": "uuid-string",
  "recipient_address": "0x0000000000000000000000000000000000000000",
  "certificate_type": "donor",
  "certificate_hash": "0xhash"
}
```

## POST /api/certificates/:id/issue

Updates the on-chain issuance transaction hash for an existing certificate.

### Request

```json
{
  "tx_hash": "0xhashofissuance"
}
```

## GET /api/certificates/hash/:hash

Looks up certificate verification data by deterministic certificate hash.

Frontend verification page: `/verify/certificate/[hash]`.

### Response

```json
{
  "status": "issued",
  "certificate_type": "donor",
  "campaign_id": "uuid-string",
  "recipient_address": "0x0000000000000000000000000000000000000000",
  "certificate_uri": "https://example.com/certificate.html",
  "certificate_hash": "0xhash",
  "issued_at": "2026-07-24T00:00:00Z",
  "issue_tx_hash": "0xhashofissuance"
}
```

## Rules

- Certificate records must match existing campaigns, donations, and proofs in the PostgreSQL database.
- Smart Contract verification ensures the actual issuance exists on-chain before the `tx_hash` is updated.
- Unknown hashes return `404`.
