import { fail, ok } from '../lib/http';
import { parseCreateDonationRequest, parseLinkDonationCertificateRequest } from '../lib/requests';
import { createSupabaseAdmin } from '../lib/supabase-admin';
import { getCampaignById } from '../repositories/campaigns';
import {
  createDonation,
  getDonationById,
  getDonationByTxHash,
  linkDonationCertificate,
  listDonationsByCampaign,
} from '../repositories/donations';
import { type DbClient } from '../repositories/types';

export async function createDonationRuntime(body: unknown, db = createSupabaseAdmin() as unknown as DbClient) {
  try {
    const input = parseCreateDonationRequest(body);
    await getCampaignById(db, input.campaign_id);
    return ok(await createDonation(db, input), 201);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Donation creation failed');
  }
}

export async function getDonationRuntime(id: string, db = createSupabaseAdmin() as unknown as DbClient) {
  try {
    return ok(await getDonationById(db, id));
  } catch {
    return fail('Donation not found', 404);
  }
}

export async function getDonationByTxHashRuntime(txHash: string, db = createSupabaseAdmin() as unknown as DbClient) {
  try {
    return ok(await getDonationByTxHash(db, txHash));
  } catch {
    return fail('Donation not found', 404);
  }
}

export async function listDonationsRuntime(campaignId: string, db = createSupabaseAdmin() as unknown as DbClient) {
  try {
    return ok(await listDonationsByCampaign(db, campaignId));
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Donation list failed');
  }
}

export async function linkDonationCertificateRuntime(body: unknown, db = createSupabaseAdmin() as unknown as DbClient) {
  try {
    const input = parseLinkDonationCertificateRequest(body);
    return ok(await linkDonationCertificate(db, input.donationId, input.certificateId));
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Donation certificate link failed');
  }
}
