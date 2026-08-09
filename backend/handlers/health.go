package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/buy7or/k8s-of-empires/models"
)

func Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	response := models.HealthResponse{
		Status: "ok",
	}

	json.NewEncoder(w).Encode(response)
}
