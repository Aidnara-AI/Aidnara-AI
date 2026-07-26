import { useParams } from "@solidjs/router";
import { createSignal, onMount } from "solid-js";

type CertificateData = {
  status?: string;
  certificate_type?: string;
  campaign_id?: string;
  recipient_address?: string;
  certificate_hash?: string;
  issued_at?: string;
  issue_tx_hash?: string;
};

export default function CertificatePage() {
  const params = useParams();
  const [certificate, setCertificate] = createSignal<CertificateData>();
  const [notice, setNotice] = createSignal("Loading certificate...");

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
          issued_at: new Date().toISOString(),
        });
        setNotice("Certificate API unavailable. Showing demo certificate.");
      } else {
        setNotice("Certificate not found.");
      }
    }
  });

  const verifyPath = () => `/verify/certificate/${params.hash}`;
  const verifyUrl = () => (typeof window === "undefined" ? verifyPath() : `${window.location.origin}${verifyPath()}`);
  // ponytail: external QR image API, swap for a local QR lib if offline demo matters
  const qrSrc = () => `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verifyUrl())}`;

  return (
    <main class="w-[min(760px,calc(100%-32px))] mx-auto py-16 grid gap-6 print:py-4">
      {notice() && <p class="rounded-2xl border border-yellow-300/30 bg-yellow-300/10 p-4 text-gold print:hidden">{notice()}</p>}
      {certificate() && (
        <article class="grid gap-6 rounded-3xl border-2 border-gold/40 bg-[#0f1b2d]/70 p-10 text-center print:border-black print:bg-white print:text-black">
          <p class="text-gold font-bold uppercase tracking-[0.2em]">Aidnara AI</p>
          <h1 class="text-4xl font-bold">
            {certificate()!.certificate_type === "organizer" ? "Transparency Certificate" : "Certificate of Impact"}
          </h1>
          <p class="text-muted print:text-black">This certificate is issued to</p>
          <code class="break-all text-2xl text-white print:text-black">{certificate()!.recipient_address}</code>
          <p class="text-muted print:text-black">for verified contribution to campaign</p>
          <strong class="text-xl">{certificate()!.campaign_id}</strong>
          {certificate()!.issued_at && <p class="text-muted print:text-black">Issued: {certificate()!.issued_at}</p>}
          <img class="mx-auto rounded-xl bg-white p-2" src={qrSrc()} alt="QR code linking to certificate verification page" width="180" height="180" />
          <a class="break-all text-cyan-300 underline print:text-black" href={verifyPath()}>{verifyUrl()}</a>
          <code class="break-all text-muted text-sm print:text-black">{certificate()!.certificate_hash}</code>
        </article>
      )}
      <button class="rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 px-5 py-3 font-extrabold text-white print:hidden" type="button" onClick={() => window.print()}>
        Print Certificate
      </button>
    </main>
  );
}
