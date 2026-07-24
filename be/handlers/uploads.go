package handlers

import (
	"aidnara-be/services"

	"github.com/gofiber/fiber/v2"
)

type UploadHandler struct{}

func NewUploadHandler() *UploadHandler {
	return &UploadHandler{}
}

// POST /api/uploads
func (h *UploadHandler) UploadFile(c *fiber.Ctx) error {
	kind := c.FormValue("kind")
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "File is required"})
	}

	path, err := services.SaveFile(kind, file)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"path": path})
}
