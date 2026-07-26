package handlers

import (
	"context"
	"strings"

	"aidnara-be/db/sqlc"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type CampaignHandler struct {
	Queries *db.Queries
	Conn    *pgx.Conn
}

func NewCampaignHandler(conn *pgx.Conn) *CampaignHandler {
	return &CampaignHandler{
		Queries: db.New(conn),
		Conn:    conn,
	}
}

// GET /api/campaigns
func (h *CampaignHandler) ListCampaigns(c *fiber.Ctx) error {
	campaigns, err := h.Queries.ListCampaigns(context.Background())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to list campaigns"})
	}
	if campaigns == nil {
		campaigns = []db.Campaign{}
	}

	return c.JSON(campaigns)
}

// GET /api/campaigns/:id
func (h *CampaignHandler) GetCampaign(c *fiber.Ctx) error {
	idParam := c.Params("id")
	campaignUUID, err := uuid.Parse(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid Campaign ID"})
	}

	pgUUID := pgtype.UUID{Bytes: campaignUUID, Valid: true}
	campaign, err := h.Queries.GetCampaign(context.Background(), pgUUID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Campaign not found"})
	}

	return c.JSON(campaign)
}

// POST /api/campaigns
func (h *CampaignHandler) CreateCampaign(c *fiber.Ctx) error {
	type Request struct {
		OwnerAddress     string `json:"owner_address"`
		Title            string `json:"title"`
		ShortDescription string `json:"short_description"`
		LongDescription  string `json:"long_description"`
		Category         string `json:"category"`
		TargetAmount     string `json:"target_amount"`
		CoverImageUrl    string `json:"cover_image_url"`
		BeneficiaryName  string `json:"beneficiary_name"`
		Location         string `json:"location"`
		ExpectedImpact   string `json:"expected_impact"`
	}
	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}
	if strings.TrimSpace(req.Title) == "" || strings.TrimSpace(req.OwnerAddress) == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Title and owner address are required"})
	}

	var targetAmount pgtype.Numeric
	if err := targetAmount.Scan(strings.TrimSpace(req.TargetAmount)); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid target amount"})
	}

	campaign, err := h.Queries.CreateCampaign(context.Background(), db.CreateCampaignParams{
		OwnerAddress:     req.OwnerAddress,
		Title:            req.Title,
		ShortDescription: req.ShortDescription,
		LongDescription:  req.LongDescription,
		Category:         req.Category,
		TargetAmount:     targetAmount,
		CoverImageUrl:    req.CoverImageUrl,
		BeneficiaryName:  req.BeneficiaryName,
		Location:         req.Location,
		ExpectedImpact:   req.ExpectedImpact,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create campaign"})
	}

	return c.Status(fiber.StatusCreated).JSON(campaign)
}
