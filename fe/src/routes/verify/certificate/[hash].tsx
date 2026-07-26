import { useParams } from "@solidjs/router";
import { createMemo, createSignal, onMount } from "solid-js";

type CertificateVerification = {
  status?: string;
  certificate_type?: string;
  campaign_id?: string;
  recipient_address?: string;
  certificate_uri?: string;
  certificate_hash?: string;
  issued_at?: string;
  issue_tx_hash?: string;
};

export default function VerifyCertificatePage() {
  const params = useParams();
  const [certificate, setCertificate] = createSignal<CertificateVerification>();
  const [found, setFound] = createSignal(true);
  const [notice, setNotice] = createSignal("Checking certificate...");

  onMount(async () => {
    try {
      const response = await fetch(`/api/certificates/hash/${params.hash}`);
      if (!response.ok) throw new Error("Certificate not found");
      setCertificate(await response.json());
      setNotice("");
    } catch {
      if (params.hash === "demo-certificate-hash") {
        setCertificate({
          status: "issued",
          certificate_type: "donor",
          campaign_id: "demo-education-aid",
          recipient_address: "0x0000000000000000000000000000000000000002",
          certificate_hash: params.hash,
          issue_tx_hash: "0xdemo",
        });
        setNotice("Certificate API unavailable. Showing demo verification data.");
      } else {
        setFound(false);
        setNotice("");
      }
    }
  });

  const verdict = createMemo(() => {
    if (!found()) return { label: "NOT FOUND", tone: "border-red-400/30 bg-red-400/10 text-red-300" };
    const status = (certificate()?.status || "").toLowerCase();
    if (status === "revoked") return { label: "REVOKED", tone: "border-red-400/30 bg-red-400/10 text-red-300" };
    if (certificate()?.issue_tx_hash) return { label: "VALID ON-CHAIN", tone: "border-green-400/30 bg-green-400/10 text-green-300" };
    return { label: "PENDING", tone: "border-yellow-300/30 bg-yellow-300/10 text-gold" };
  });

  return (
    <main class="w-[min(760px,calc(100%-32px))] mx-auto py-16 grid gap-6">
      <section class="grid gap-4 rounded-3xl border border-white/10 bg-[#0f1b2d]/70 p-6">
        <p class="text-gold font-bold uppercase tracking-[0.14em]">Aidnara AI</p>
        <h1 class="text-5xl font-bold">Verify Certificate</h1>
        <strong class={`rounded-2xl border p-4 text-2xl uppercase tracking-[0.14em] ${verdict().tone}`}>{verdict().label}</strong>
        {notice() && <p class="rounded-2xl border border-yellow-300/30 bg-yellow-300/10 p-4 text-gold">{notice()}</p>}
        {certificate() && (
          <div class="grid gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5">
            <span>{certificate()!.certificate_type}</span>
            <code class="break-all text-white">{certificate()!.certificate_hash}</code>
            <p class="text-muted">Recipient: {certificate()!.recipient_address}</p>
            <p class="text-muted">Campaign: {certificate()!.campaign_id}</p>
            {certificate()!.issued_at && <p class="text-muted">Issued: {certificate()!.issued_at}</p>}
            {certificate()!.certificate_uri && (
              <a class="break-all text-cyan-300 underline" href={certificate()!.certificate_uri} target="_blank">
                Open certificate file
              </a>
            )}
            {certificate()!.issue_tx_hash && (
              <a class="break-all text-cyan-300 underline" href={explorerTxUrl(certificate()!.issue_tx_hash!)} target="_blank">
                View transaction on BscScan: {certificate()!.issue_tx_hash}
              </a>
            )}
            <a class="text-cyan-300 underline" href={`/certificate/${params.hash}`}>Open printable certificate</a>
          </div>
        )}
      </section>
    </main>
  );
}

function explorerTxUrl(txHash: string) {
  return `https://testnet.bscscan.com/tx/${txHash}`;
}
