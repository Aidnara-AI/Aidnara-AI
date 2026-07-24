import { useParams } from "@solidjs/router";
import { createSignal, onMount } from "solid-js";
import { demoCampaigns, type DemoCampaign } from "../demo-campaigns";

export default function CampaignDetailPage() {
  const params = useParams();
  const [campaign, setCampaign] = createSignal<DemoCampaign | undefined>();
  const [notice, setNotice] = createSignal("Loading campaign...");
  const [donationStatus, setDonationStatus] = createSignal("");
  const [proofStatus, setProofStatus] = createSignal("");
  const [certificateStatus, setCertificateStatus] = createSignal("");

  onMount(async () => {
    try {
      const response = await fetch(`/api/campaigns/${params.id}`);
      if (!response.ok) throw new Error("Campaign API unavailable");
      setCampaign(await response.json());
      setNotice("");
    } catch {
      const demoCampaign = demoCampaigns.find((item) => item.id === params.id);
      setCampaign(demoCampaign);
      setNotice(demoCampaign ? "Campaign API unavailable. Showing demo data." : "Campaign not found.");
    }
  });

  async function submitJson(event: SubmitEvent, url: string, setMessage: (message: string) => void) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form).entries());

    setMessage("Saving...");

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ campaign_id: params.id, ...data }),
      });

      if (!response.ok) throw new Error("API rejected the request");
      setMessage("Saved.");
      form.reset();
    } catch {
      setMessage("Could not save yet. Check backend API, database, and chain config.");
    }
  }

  return (
    <main class="w-[min(760px,calc(100%-32px))] mx-auto py-16 grid gap-6">
      {notice() && <p class="rounded-2xl border border-yellow-300/30 bg-yellow-300/10 p-4 text-gold">{notice()}</p>}
      {campaign() && (
        <article class="grid gap-4 rounded-3xl border border-white/10 bg-[#0f1b2d]/70 p-6">
          <p class="text-gold font-bold uppercase tracking-[0.14em]">{campaign()!.category}</p>
          <h1 class="text-5xl font-bold">{campaign()!.title}</h1>
          <p class="text-muted text-xl leading-relaxed">{campaign()!.short_description}</p>
          <div class="flex flex-wrap gap-3">
            <span class="rounded-full bg-cyan-500/10 px-4 py-2 font-bold">{campaign()!.target_amount} BNB target</span>
            <span class="rounded-full bg-cyan-500/10 px-4 py-2 font-bold">{campaign()!.latest_trust_score} trust score</span>
          </div>
        </article>
      )}

      <form class="grid gap-4 rounded-3xl border border-white/10 bg-[#0f1b2d]/70 p-6" onSubmit={(event) => submitJson(event, "/api/donations", setDonationStatus)}>
        <h2 class="text-3xl font-bold">Record Donation</h2>
        <p class="text-muted">Submit a confirmed donation transaction for this campaign.</p>
        <label class="grid gap-2 font-bold">
          Donor wallet
          <input class="rounded-xl border border-white/10 bg-bg p-3" name="donor_address" placeholder="0x..." required />
        </label>
        <label class="grid gap-2 font-bold">
          Amount in wei
          <input class="rounded-xl border border-white/10 bg-bg p-3" name="amount" inputmode="numeric" placeholder="10000000000000000" required />
        </label>
        <label class="grid gap-2 font-bold">
          Transaction hash
          <input class="rounded-xl border border-white/10 bg-bg p-3" name="tx_hash" placeholder="0x..." required />
        </label>
        <button class="rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 px-5 py-3 font-extrabold text-white" type="submit">
          Save Donation
        </button>
        {donationStatus() && <p class="rounded-2xl border border-yellow-300/30 bg-yellow-300/10 p-4 text-gold">{donationStatus()}</p>}
      </form>

      <form class="grid gap-4 rounded-3xl border border-white/10 bg-[#0f1b2d]/70 p-6" onSubmit={(event) => submitJson(event, "/api/proofs", setProofStatus)}>
        <h2 class="text-3xl font-bold">Submit Proof</h2>
        <p class="text-muted">Upload metadata for proof of fund usage. AI analysis runs in the backend.</p>
        <label class="grid gap-2 font-bold">
          Title
          <input class="rounded-xl border border-white/10 bg-bg p-3" name="title" placeholder="Pembelian perangkat belajar" required />
        </label>
        <label class="grid gap-2 font-bold">
          Description
          <textarea class="min-h-24 rounded-xl border border-white/10 bg-bg p-3" name="description" placeholder="Ringkasan bukti penggunaan dana." required />
        </label>
        <label class="grid gap-2 font-bold">
          Amount used
          <input class="rounded-xl border border-white/10 bg-bg p-3" name="amount_used" type="number" min="0.001" step="0.001" placeholder="0.03" required />
        </label>
        <label class="grid gap-2 font-bold">
          Impact claim
          <textarea class="min-h-24 rounded-xl border border-white/10 bg-bg p-3" name="impact_claim" placeholder="Dampak dari dana yang digunakan." required />
        </label>
        <label class="grid gap-2 font-bold">
          File URL
          <input class="rounded-xl border border-white/10 bg-bg p-3" name="file_url" type="url" placeholder="https://example.com/proof.png" required />
        </label>
        <label class="grid gap-2 font-bold">
          File hash
          <input class="rounded-xl border border-white/10 bg-bg p-3" name="file_hash" placeholder="0x..." required />
        </label>
        <button class="rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 px-5 py-3 font-extrabold text-white" type="submit">
          Save Proof
        </button>
        {proofStatus() && <p class="rounded-2xl border border-yellow-300/30 bg-yellow-300/10 p-4 text-gold">{proofStatus()}</p>}
      </form>

      <form class="grid gap-4 rounded-3xl border border-white/10 bg-[#0f1b2d]/70 p-6" onSubmit={(event) => submitJson(event, "/api/certificates", setCertificateStatus)}>
        <h2 class="text-3xl font-bold">Create Certificate Record</h2>
        <p class="text-muted">Register a certificate hash, then verify it at `/verify/certificate/[hash]`.</p>
        <label class="grid gap-2 font-bold">
          Donation ID
          <input class="rounded-xl border border-white/10 bg-bg p-3" name="donation_id" placeholder="uuid" required />
        </label>
        <label class="grid gap-2 font-bold">
          Proof ID
          <input class="rounded-xl border border-white/10 bg-bg p-3" name="proof_id" placeholder="uuid" required />
        </label>
        <label class="grid gap-2 font-bold">
          Recipient wallet
          <input class="rounded-xl border border-white/10 bg-bg p-3" name="recipient_address" placeholder="0x..." required />
        </label>
        <label class="grid gap-2 font-bold">
          Certificate type
          <select class="rounded-xl border border-white/10 bg-bg p-3" name="certificate_type" required>
            <option value="donor">Donor</option>
            <option value="organizer">Organizer</option>
          </select>
        </label>
        <label class="grid gap-2 font-bold">
          Certificate hash
          <input class="rounded-xl border border-white/10 bg-bg p-3" name="certificate_hash" placeholder="0x..." required />
        </label>
        <button class="rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 px-5 py-3 font-extrabold text-white" type="submit">
          Save Certificate
        </button>
        {certificateStatus() && <p class="rounded-2xl border border-yellow-300/30 bg-yellow-300/10 p-4 text-gold">{certificateStatus()}</p>}
      </form>
    </main>
  );
}
