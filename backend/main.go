package main

import (
	"log"
	"net/http"

	kubeclient "github.com/buy7or/k8s-of-empires/kubernetes"
	"github.com/buy7or/k8s-of-empires/routes"
)

func main() {
	clientset, err := kubeclient.NewClient()
	if err != nil {
		log.Fatal(err)
	}

	routes.Register(clientset)

	log.Println("API listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
