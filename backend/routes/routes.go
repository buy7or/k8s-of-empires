package routes

import (
	"net/http"

	"github.com/buy7or/k8s-of-empires/handlers"
	"k8s.io/client-go/kubernetes"
)

func New(clientset kubernetes.Interface) http.Handler {
	mux := http.NewServeMux()

	// API
	mux.HandleFunc("/api/health", handlers.Health)
	mux.HandleFunc("/api/cluster/health", handlers.ClusterHealth(clientset))
	mux.HandleFunc("/api/nodes", handlers.Nodes(clientset))
	mux.HandleFunc("/api/pods", handlers.Pods(clientset))
	mux.HandleFunc("/api/deployments", handlers.Deployments(clientset))
	mux.HandleFunc("/api/namespaces", handlers.Namespaces(clientset))

	// Frontend
	frontend := http.FileServer(http.Dir("./frontend"))
	mux.Handle("/", frontend)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set(
			"Access-Control-Allow-Methods",
			http.MethodGet+", "+http.MethodOptions,
		)
		w.Header().Set(
			"Access-Control-Allow-Headers",
			"Accept, Content-Type",
		)

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		mux.ServeHTTP(w, r)
	})
}
