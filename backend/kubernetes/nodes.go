package kubernetes

import (
	"context"

	"github.com/buy7or/k8s-of-empires/models"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	k8s "k8s.io/client-go/kubernetes"
)

func GetNodes(clientset *k8s.Clientset) ([]models.NodeResponse, error) {
	nodes, err := clientset.CoreV1().
		Nodes().
		List(context.Background(), metav1.ListOptions{})

	if err != nil {
		return nil, err
	}

	response := make([]models.NodeResponse, 0, len(nodes.Items))

	for _, node := range nodes.Items {
		ip := ""

		for _, address := range node.Status.Addresses {
			if address.Type == "InternalIP" {
				ip = address.Address
				break
			}
		}

		response = append(response, models.NodeResponse{
			Name: node.Name,
			IP:   ip,
		})
	}

	return response, nil
}
