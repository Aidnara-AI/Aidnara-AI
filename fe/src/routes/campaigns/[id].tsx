import { useParams } from "@solidjs/router";
import { For, createMemo, createSignal, onMount } from "solid-js";
import { demoCampaigns, type DemoCampaign } from "../demo-campaigns";

export default function CampaignDetailPage() {
  const params = useParams();
  const [campaign, setCampaign] = createSignal<DemoCampaign | undefined>();
  const [donations, setDonations] = createSignal<Record<string, unknown>[]>([]);
  const [proofs, setProofs] = createSignal<Record<string, unknown>[]>([]);
  const [notice, setNotice] = createSignal("Loading campaign...");
  const [donationStatus, setDonationStatus] = createSignal("");
  const [proofStatus, setProofStatus] = createSignal("");
  const [certificateStatus, setCertificateStatus] = createSignal("");
  const [issueStatus, setIssueStatus] = createSignal("");

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

    try {
      const response = await fetch(`/api/campaigns/${params.id}/donations`);
      if (response.ok) setDonations(await response.json());
    } catch {
      setDonations([]);
    }

    try {
      const response = await fetch(`/api/campaigns/${params.id}/proofs`);
      if (response.ok) setProofs(await response.json());
    } catch {
      setProofs([]);
    }
  });

  const totalDonated = createMemo(() => sumField(donations(), "amount"));
  const totalProofAmount = createMemo(() => sumField(proofs(), "amount_used"));
  const remainingEstimate = createMemo(() => Math.max(Number(campaign()?.target_amount || 0) - totalDonated(), 0));

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

  async function submitProof(event: SubmitEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const file = formData.get("file");

    if (!(file instanceof File)) {
      setProofStatus("Proof file is required.");
      return;
    }

    setProofStatus("Uploading proof file...");

    try {
      const fileHash = await sha256Hex(file);
      const upload = new FormData();
      upload.set("kind", "proof");
      upload.set("file", file);

      const uploadResponse = await fetch("/api/uploads", { method: "POST", body: upload });
      if (!uploadResponse.ok) throw new Error("Upload failed");
      const uploaded = await uploadResponse.json();

      const proofResponse = await fetch("/api/proofs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          campaign_id: params.id,
          title: formData.get("title"),
          description: formData.get("description"),
          amount_used: formData.get("amount_used"),
          impact_claim: formData.get("impact_claim"),
          file_url: uploaded.path,
          file_hash: fileHash,
        }),
      });

      if (!proofResponse.ok) throw new Error("Proof API rejected the request");
      setProofStatus("Proof saved with SHA-256 hash.");
      form.reset();
    } catch {
      setProofStatus("Could not save proof yet. Check upload, backend API, and database config.");
    }
  }

  async function issueCertificate(event: SubmitEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form).entries());

    setIssueStatus("Saving...");

    try {
      const response = await fetch(`/api/certificates/${data.certificate_id}/issue`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tx_hash: data.tx_hash }),
      });

      if (!response.ok) throw new Error("API rejected the request");
      setIssueStatus("Certificate issuance saved.");
      form.reset();
    } catch {
      setIssueStatus("Could not issue certificate yet. Check certificate ID and chain tx hash.");
    }
  }

  async function sha256Hex(file: File) {
    const bytes = await file.arrayBuffer();
    const hash = await crypto.subtle.digest("SHA-256", bytes);
    return `0x${Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
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

      <section class="grid gap-4 rounded-3xl border border-white/10 bg-[#0f1b2d]/70 p-6">
        <h2 class="text-3xl font-bold">Transparency Dashboard</h2>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
          <span class="rounded-2xl bg-cyan-500/10 p-4 font-bold">Total donated: {totalDonated()}</span>
          <span class="rounded-2xl bg-cyan-500/10 p-4 font-bold">Proof amount: {totalProofAmount()}</span>
          <span class="rounded-2xl bg-cyan-500/10 p-4 font-bold">Remaining estimate: {remainingEstimate()}</span>
        </div>
        <div class="grid gap-3">
          <h3 class="text-2xl font-bold">Donation Timeline</h3>
          {donations().length === 0 && <p class="text-muted">No donations recorded yet.</p>}
          <For each={donations()}>
            {(donation) => (
              <article class="grid gap-1 rounded-2xl border border-white/10 p-4 text-muted">
                <strong class="text-white">{String(donation.donor_address || "Unknown donor")}</strong>
                <code class="break-all">Donation ID: {String(donation.id || "unknown")}</code>
                <span>Amount: {displayAmount(donation.amount)}</span>
                <code class="break-all">{String(donation.tx_hash || "No tx hash")}</code>
              </article>
            )}
          </For>
        </div>
        <div class="grid gap-3">
          <h3 class="text-2xl font-bold">Proof Timeline</h3>
          {proofs().length === 0 && <p class="text-muted">No proofs submitted yet.</p>}
          <For each={proofs()}>
            {(proof) => (
              <article class="grid gap-1 rounded-2xl border border-white/10 p-4 text-muted">
                <strong class="text-white">{String(proof.title || "Untitled proof")}</strong>
                <code class="break-all">Proof ID: {String(proof.id || "unknown")}</code>
                <span>Status: {String(proof.ai_status || "pending")}</span>
                <span>Amount used: {displayAmount(proof.amount_used)}</span>
                <code class="break-all">{String(proof.file_hash || "No file hash")}</code>
              </article>
            )}
          </For>
        </div>
      </section>

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

      <form class="grid gap-4 rounded-3xl border border-white/10 bg-[#0f1b2d]/70 p-6" onSubmit={submitProof}>
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
          Proof file
          <input class="rounded-xl border border-white/10 bg-bg p-3" name="file" type="file" accept="image/*,application/pdf" required />
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
          Certificate hash (optional)
          <input class="rounded-xl border border-white/10 bg-bg p-3" name="certificate_hash" placeholder="Leave empty to generate from campaign, donation, proof, recipient, and type." />
        </label>
        <button class="rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 px-5 py-3 font-extrabold text-white" type="submit">
          Save Certificate
        </button>
        {certificateStatus() && <p class="rounded-2xl border border-yellow-300/30 bg-yellow-300/10 p-4 text-gold">{certificateStatus()}</p>}
      </form>

      <form class="grid gap-4 rounded-3xl border border-white/10 bg-[#0f1b2d]/70 p-6" onSubmit={issueCertificate}>
        <h2 class="text-3xl font-bold">Issue Certificate</h2>
        <p class="text-muted">Attach an on-chain issuance transaction hash to an existing certificate.</p>
        <label class="grid gap-2 font-bold">
          Certificate ID
          <input class="rounded-xl border border-white/10 bg-bg p-3" name="certificate_id" placeholder="uuid" required />
        </label>
        <label class="grid gap-2 font-bold">
          Issuance transaction hash
          <input class="rounded-xl border border-white/10 bg-bg p-3" name="tx_hash" placeholder="0x..." required />
        </label>
        <button class="rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 px-5 py-3 font-extrabold text-white" type="submit">
          Save Issuance
        </button>
        {issueStatus() && <p class="rounded-2xl border border-yellow-300/30 bg-yellow-300/10 p-4 text-gold">{issueStatus()}</p>}
      </form>
    </main>
  );
}

function displayAmount(value: unknown) {
  if (typeof value === "number" || typeof value === "string") return String(value);
  if (value && typeof value === "object" && "Int" in value) return String((value as { Int: unknown }).Int);
  return "0";
}

function sumField(rows: Record<string, unknown>[], field: string) {
  return rows.reduce((sum, row) => sum + Number(displayAmount(row[field]) || 0), 0);
}
