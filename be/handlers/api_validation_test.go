package handlers

// API validation tests per PRD 09. Invalid requests must be rejected with 400
// before any database access, so handlers run with a nil connection.

import (
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func postJSON(t *testing.T, app *fiber.App, url string, body string) int {
	t.Helper()
	req := httptest.NewRequest("POST", url, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	return resp.StatusCode
}

func testApp() *fiber.App {
	app := fiber.New()
	proofs := &ProofHandler{}
	donations := &DonationHandler{}
	certificates := &CertificateHandler{}
	app.Post("/api/proofs", proofs.CreateProof)
	app.Post("/api/donations", donations.CreateDonation)
	app.Post("/api/certificates", certificates.CreateCertificate)
	app.Post("/api/certificates/:id/issue", certificates.UpdateCertificateTxHash)
	return app
}

func TestProofRejectsMissingFields(t *testing.T) {
	app := testApp()
	cases := []string{
		`{}`,
		`{"campaign_id":"x","title":"t"}`,
		`{"campaign_id":"x","title":"t","description":"d","impact_claim":"i","file_url":"u","file_hash":"h","amount_used":"0"}`,
		`{"campaign_id":"x","title":"t","description":"d","impact_claim":"i","file_url":"u","file_hash":"h","amount_used":"abc"}`,
		`{"campaign_id":"not-a-uuid","title":"t","description":"d","impact_claim":"i","file_url":"u","file_hash":"h","amount_used":"0.5"}`,
	}
	for _, body := range cases {
		if code := postJSON(t, app, "/api/proofs", body); code != fiber.StatusBadRequest {
			t.Errorf("proof body %s: got %d, want 400", body, code)
		}
	}
}

func TestDonationRejectsInvalidInput(t *testing.T) {
	app := testApp()
	goodTx := "0x" + strings.Repeat("ab12", 16)
	cases := []string{
		`{}`,
		`{"tx_hash":"0x123","donor_address":"0xabc","amount":"1","campaign_id":"x"}`,
		`{"tx_hash":"` + goodTx + `","donor_address":"","amount":"1","campaign_id":"x"}`,
		`{"tx_hash":"` + goodTx + `","donor_address":"0xabc","amount":"1","campaign_id":"not-a-uuid"}`,
	}
	for _, body := range cases {
		if code := postJSON(t, app, "/api/donations", body); code != fiber.StatusBadRequest {
			t.Errorf("donation body %s: got %d, want 400", body, code)
		}
	}
}

func TestCertificateRejectsInvalidInput(t *testing.T) {
	app := testApp()
	uuid := "01234567-89ab-cdef-0123-456789abcdef"
	cases := []string{
		`{}`,
		`{"campaign_id":"not-a-uuid","donation_id":"` + uuid + `","proof_id":"` + uuid + `","recipient_address":"0xabc","certificate_type":"donor"}`,
		`{"campaign_id":"` + uuid + `","donation_id":"` + uuid + `","proof_id":"` + uuid + `","recipient_address":"0xabc","certificate_type":"unsupported"}`,
		`{"campaign_id":"` + uuid + `","donation_id":"` + uuid + `","proof_id":"` + uuid + `","recipient_address":"","certificate_type":"donor"}`,
	}
	for _, body := range cases {
		if code := postJSON(t, app, "/api/certificates", body); code != fiber.StatusBadRequest {
			t.Errorf("certificate body %s: got %d, want 400", body, code)
		}
	}
}

func TestCertificateIssueRejectsInvalidInput(t *testing.T) {
	app := testApp()
	uuid := "01234567-89ab-cdef-0123-456789abcdef"
	if code := postJSON(t, app, "/api/certificates/not-a-uuid/issue", `{"tx_hash":"0x123"}`); code != fiber.StatusBadRequest {
		t.Errorf("bad certificate id: got %d, want 400", code)
	}
	if code := postJSON(t, app, "/api/certificates/"+uuid+"/issue", `{"tx_hash":"0x123"}`); code != fiber.StatusBadRequest {
		t.Errorf("bad tx hash: got %d, want 400", code)
	}
}
