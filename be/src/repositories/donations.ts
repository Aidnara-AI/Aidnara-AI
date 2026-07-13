import { type DbClient, unwrap, unwrapList } from './types';

export type DonationInsert = {
  campaign_id: string;
  donor_address: string;
  amount: string;
  tx_hash: string;
};

export type Donation = DonationInsert & {
  id: string;
  certificate_id: string | null;
  created_at: string;
};

export async function createDonation(db: DbClient, input: DonationInsert) {
  const result = await db.from<DonationInsert, Donation>('donations').insert(input).select().single();
  return unwrap(result, 'Donation was not created');
}

export async function getDonationById(db: DbClient, id: string) {
  const result = await db.from<never, Donation>('donations').select('*').eq('id', id).single();
  return unwrap(result, 'Donation not found');
}

export async function getDonationByTxHash(db: DbClient, txHash: string) {
  const result = await db.from<never, Donation>('donations').select('*').eq('tx_hash', txHash).single();
  return unwrap(result, 'Donation not found');
}

export async function listDonationsByCampaign(db: DbClient, campaignId: string) {
  const result = await db
    .from<never, Donation>('donations')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false });

  return unwrapList(result);
}

export async function linkDonationCertificate(db: DbClient, donationId: string, certificateId: string) {
  const result = await db
    .from<never, Donation>('donations')
    .update({ certificate_id: certificateId })
    .eq('id', donationId)
    .select()
    .single();

  return unwrap(result, 'Donation certificate was not linked');
}
