package handlers

import (
	"strings"
	"testing"
)

func TestValidTxHash(t *testing.T) {
	valid := "0x" + strings.Repeat("ab12", 16)
	if !validTxHash(valid) {
		t.Errorf("expected valid tx hash to pass")
	}
	invalid := []string{
		"",
		"0x123",
		strings.Repeat("a", 66),
		"0x" + strings.Repeat("zz", 32),
		" 0x" + strings.Repeat("ab12", 16) + " extra",
	}
	for _, value := range invalid {
		if validTxHash(value) {
			t.Errorf("expected %q to be rejected", value)
		}
	}
}

func TestGenerateCertificateHashDeterministic(t *testing.T) {
	first := GenerateCertificateHash("camp", "don", "proof", "0xRecipient", "donor")
	second := GenerateCertificateHash(" CAMP ", " don ", "proof", "0xrecipient", "DONOR")
	if first != second {
		t.Errorf("hash must be deterministic and case/space insensitive: %s != %s", first, second)
	}
	if len(first) != 66 || !strings.HasPrefix(first, "0x") {
		t.Errorf("hash must be 0x + 64 hex chars, got %s", first)
	}
	other := GenerateCertificateHash("camp2", "don", "proof", "0xrecipient", "donor")
	if first == other {
		t.Errorf("different inputs must produce different hashes")
	}
}
