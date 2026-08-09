package handlers

import (
	"log"
	"net/http"

	kubeservice "github.com/buy7or/k8s-of-empires/kubernetes"
	"k8s.io/client-go/kubernetes"
)

func Nodes(clientset kubernetes.Interface) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		nodes, err := kubeservice.GetNodes(r.Context(), clientset)
		if err != nil {
			log.Printf("error getting nodes: %v", err)
			writeResourceError(w, "nodes")
			return
		}

		writeJSON(w, http.StatusOK, nodes)
	}
}
