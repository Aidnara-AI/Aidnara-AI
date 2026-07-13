# AidnaraAidRegistry Test Plan

Implement these tests when Hardhat dependencies are installed.

## Campaign

- Creates campaign with owner, metadata URI, target amount, and active status.
- Reverts when metadata URI is empty.
- Reverts when target amount is zero.

## Donation

- Accepts native token donation for active campaign.
- Increases `totalDonated`.
- Emits `DonationReceived`.
- Reverts on zero donation.
- Reverts for missing campaign.

## Proof

- Lets campaign owner submit proof.
- Stores proof URI and hash.
- Emits `ProofSubmitted`.
- Reverts when non-owner submits proof.
- Reverts when proof hash is zero.

## Certificate

- Lets campaign owner issue certificate.
- Stores certificate payload by hash.
- `verifyCertificate` returns certificate data.
- Reverts when certificate hash already exists.
- Reverts when unknown hash is verified.
- Reverts when non-owner issues certificate.

## Withdrawal

- Lets campaign owner withdraw available balance.
- Reverts when non-owner withdraws.
- Reverts when amount is zero.
- Reverts when campaign balance is insufficient.
- Prevents one campaign owner from withdrawing another campaign's donations.
