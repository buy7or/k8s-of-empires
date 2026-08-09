package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/buy7or/k8s-of-empires/models"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

func ClusterHealth(clientset kubernetes.Interface) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		_, err := clientset.CoreV1().
			Nodes().
			List(r.Context(), metav1.ListOptions{})

		if err != nil {
			w.WriteHeader(http.StatusServiceUnavailable)

			response := models.ClusterHealthResponse{
				Status:  "error",
				Cluster: "unreachable",
			}

			json.NewEncoder(w).Encode(response)
			return
		}

		response := models.ClusterHealthResponse{
			Status:  "ok",
			Cluster: "connected",
		}

		json.NewEncoder(w).Encode(response)
	}
}
