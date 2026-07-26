package services

import (
	"mime/multipart"
	"testing"
)

func header(name string, size int64) *multipart.FileHeader {
	return &multipart.FileHeader{Filename: name, Size: size}
}

func TestValidateUpload(t *testing.T) {
	cases := []struct {
		kind    string
		file    *multipart.FileHeader
		wantDir string
		wantErr bool
	}{
		{"campaign-cover", header("cover.PNG", 1024), "campaign-covers", false},
		{"proof", header("receipt.pdf", 1024), "proofs", false},
		{"certificate", header("cert.jpg", 1024), "certificates", false},
		{"campaign-cover", header("cover.pdf", 1024), "", true},  // pdf not allowed for covers
		{"proof", header("malware.exe", 1024), "", true},         // bad extension
		{"proof", header("receipt.pdf", 0), "", true},            // empty file
		{"proof", header("huge.pdf", MaxUploadSize+1), "", true}, // too large
		{"unknown", header("file.png", 1024), "", true},          // bad kind
	}

	for _, c := range cases {
		dir, err := validateUpload(c.kind, c.file)
		if c.wantErr && err == nil {
			t.Errorf("kind=%s file=%s: expected error, got none", c.kind, c.file.Filename)
		}
		if !c.wantErr && err != nil {
			t.Errorf("kind=%s file=%s: unexpected error: %v", c.kind, c.file.Filename, err)
		}
		if dir != c.wantDir {
			t.Errorf("kind=%s file=%s: dir=%q want %q", c.kind, c.file.Filename, dir, c.wantDir)
		}
	}
}
