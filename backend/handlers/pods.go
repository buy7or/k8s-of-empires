package handlers

import (
	"net/http"

	kubeservice "github.com/buy7or/k8s-of-empires/kubernetes"
	"k8s.io/client-go/kubernetes"
)

func Pods(clientset kubernetes.Interface) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pods, err := kubeservice.GetPods(r.Context(), clientset)
		if err != nil {
			writeResourceError(w, "pods")
			return
		}
		writeJSON(w, http.StatusOK, pods)
	}
}
