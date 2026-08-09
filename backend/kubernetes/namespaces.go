package kubernetes

import (
	"context"
	"sort"

	"github.com/buy7or/k8s-of-empires/models"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	k8s "k8s.io/client-go/kubernetes"
)

// GetNamespaces returns the namespaces exposed by the cluster API.
func GetNamespaces(ctx context.Context, clientset k8s.Interface) ([]models.NamespaceResponse, error) {
	namespaces, err := clientset.CoreV1().Namespaces().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	response := make([]models.NamespaceResponse, 0, len(namespaces.Items))
	for _, namespace := range namespaces.Items {
		labels := namespace.Labels
		if labels == nil {
			labels = map[string]string{}
		}
		response = append(response, models.NamespaceResponse{
			Name:   namespace.Name,
			Status: string(namespace.Status.Phase),
			Labels: labels,
		})
	}
	sort.Slice(response, func(i, j int) bool { return response[i].Name < response[j].Name })
	return response, nil
}

func resourceKey(namespace, name string) string {
	return namespace + "/" + name
}

func sortPodsByNamespace(pods []models.PodResponse) {
	sort.Slice(pods, func(i, j int) bool {
		if pods[i].Namespace == pods[j].Namespace {
			return pods[i].Name < pods[j].Name
		}
		return pods[i].Namespace < pods[j].Namespace
	})
}
