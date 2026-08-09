package handlers

import (
	"net/http"

	kubeservice "github.com/buy7or/k8s-of-empires/kubernetes"
	"k8s.io/client-go/kubernetes"
)

func Deployments(clientset kubernetes.Interface) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		deployments, err := kubeservice.GetDeployments(r.Context(), clientset)
		if err != nil {
			writeResourceError(w, "deployments")
			return
		}
		writeJSON(w, http.StatusOK, deployments)
	}
}
