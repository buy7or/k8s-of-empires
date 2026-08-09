package main

import (
	"net/http"

	"github.com/buy7or/k8s-of-empires/handlers"
)

func main() {
	http.HandleFunc("/api/health", handlers.Health)

	http.ListenAndServe(":8080", nil)
}