package handlers

import (
	"encoding/json"
	"net/http"

	kubeservice "github.com/buy7or/k8s-of-empires/kubernetes"
	"k8s.io/client-go/kubernetes"
)

func Nodes(clientset *kubernetes.Clientset) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		nodes, err := kubeservice.GetNodes(clientset)
		if err != nil {
			http.Error(
				w,
				`{"error":"could not get nodes"}`,
				http.StatusInternalServerError,
			)
			return
		}

		json.NewEncoder(w).Encode(nodes)
	}
}