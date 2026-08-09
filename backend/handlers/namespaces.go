package handlers

import (
	"net/http"

	kubeservice "github.com/buy7or/k8s-of-empires/kubernetes"
	"k8s.io/client-go/kubernetes"
)

func Namespaces(clientset kubernetes.Interface) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		namespaces, err := kubeservice.GetNamespaces(r.Context(), clientset)
		if err != nil {
			writeResourceError(w, "namespaces")
			return
		}
		writeJSON(w, http.StatusOK, namespaces)
	}
}
