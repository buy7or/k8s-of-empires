package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

func ClusterHealth(clientset *kubernetes.Clientset) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		_, err := clientset.CoreV1().
			Nodes().
			List(context.Background(), metav1.ListOptions{})

		if err != nil {
			w.WriteHeader(http.StatusServiceUnavailable)

			json.NewEncoder(w).Encode(map[string]string{
				"status":  "error",
				"cluster": "unreachable",
			})

			return
		}

		json.NewEncoder(w).Encode(map[string]string{
			"status":  "ok",
			"cluster": "connected",
		})
	}
}