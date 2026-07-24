package handlers

import (
	"context"
	"math/big"
	"os"
	"strings"

	"aidnara-be/db/sqlc"
	"aidnara-be/services"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type DonationHandler struct {
	Queries *db.Queries
	Conn    *pgx.Conn
}

func NewDonationHandler(conn *pgx.Conn) *DonationHandler {
	return &DonationHandler{
		Queries: db.New(conn),
		Conn:    conn,
	}
}

// POST /api/donations
func (h *DonationHandler) CreateDonation(c *fiber.Ctx) error {
	type Request struct {
		CampaignID string `json:"campaign_id"`
		TxHash     string `json:"tx_hash"`
		Amount     string `json:"amount"` // string to avoid precision loss
		Donor      string `json:"donor_address"`
	}
	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON"})
	}
	req.TxHash = strings.TrimSpace(req.TxHash)
	req.Donor = strings.TrimSpace(req.Donor)
	req.Amount = strings.TrimSpace(req.Amount)
	if !validTxHash(req.TxHash) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid transaction hash"})
	}
	if req.Donor == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Donor address is required"})
	}

	campaignUUID, err := uuid.Parse(req.CampaignID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid Campaign ID"})
	}
	campaignPgUUID := pgtype.UUID{Bytes: campaignUUID, Valid: true}

	// Verify the campaign exists
	campaign, err := h.Queries.GetCampaign(c.Context(), campaignPgUUID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Campaign not found"})
	}
	if !campaign.ChainCampaignID.Valid {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Campaign is not linked on-chain"})
	}

	// Verify the transaction on-chain
	amountBigInt, ok := new(big.Int).SetString(req.Amount, 10)
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid amount format"})
	}
	if amountBigInt.Sign() <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Amount must be greater than zero"})
	}

	rpcURL := os.Getenv("RPC_URL")
	contractAddress := os.Getenv("CONTRACT_ADDRESS")
	if rpcURL == "" || contractAddress == "" {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "On-chain validation is not configured"})
	}

	opts := services.OnchainValidationOptions{
		RPCUrl:          rpcURL,
		ContractAddress: contractAddress,
	}
	expect := services.DonationEventExpectation{
		TxHash:       req.TxHash,
		CampaignID:   big.NewInt(campaign.ChainCampaignID.Int64),
		DonorAddress: req.Donor,
		Amount:       amountBigInt,
	}

	// Wait for chain verification
	if err := services.ValidateDonationEvent(c.Context(), opts, expect); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	// Store in DB
	var amountNum pgtype.Numeric
	if err := amountNum.Scan(req.Amount); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid amount format"})
	}

	donation, err := h.Queries.CreateDonation(context.Background(), db.CreateDonationParams{
		CampaignID:   campaignPgUUID,
		DonorAddress: req.Donor,
		Amount:       amountNum,
		TxHash:       req.TxHash,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save donation"})
	}

	return c.Status(fiber.StatusCreated).JSON(donation)
}

// GET /api/campaigns/:id/donations
func (h *DonationHandler) ListDonationsByCampaign(c *fiber.Ctx) error {
	idParam := c.Params("id")
	campaignUUID, err := uuid.Parse(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid Campaign ID"})
	}
	campaignPgUUID := pgtype.UUID{Bytes: campaignUUID, Valid: true}

	donations, err := h.Queries.GetDonationsByCampaign(c.Context(), campaignPgUUID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get donations"})
	}

	return c.JSON(donations)
}
