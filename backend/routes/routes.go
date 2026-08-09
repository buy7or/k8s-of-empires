package routes

import (
	"net/http"

	"github.com/buy7or/k8s-of-empires/handlers"
	"k8s.io/client-go/kubernetes"
)

func Register(clientset *kubernetes.Clientset) {
	http.HandleFunc("/api/health", handlers.Health)
	http.HandleFunc("/api/cluster/health", handlers.ClusterHealth(clientset))
}