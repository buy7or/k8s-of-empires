package kubernetes

import (
	"context"
	"sort"

	"github.com/buy7or/k8s-of-empires/models"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	k8s "k8s.io/client-go/kubernetes"
)

type replicaSetDeployments map[string]string

// GetDeployments returns the deployment state required by technical clients.
func GetDeployments(ctx context.Context, clientset k8s.Interface) ([]models.DeploymentResponse, error) {
	deployments, err := clientset.AppsV1().Deployments("").List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	response := make([]models.DeploymentResponse, 0, len(deployments.Items))
	for _, deployment := range deployments.Items {
		labels := deployment.Labels
		if labels == nil {
			labels = map[string]string{}
		}
		response = append(response, models.DeploymentResponse{
			Name:              deployment.Name,
			Namespace:         deployment.Namespace,
			Replicas:          deployment.Status.Replicas,
			ReadyReplicas:     deployment.Status.ReadyReplicas,
			AvailableReplicas: deployment.Status.AvailableReplicas,
			Labels:            labels,
		})
	}
	sort.Slice(response, func(i, j int) bool {
		return resourceKey(response[i].Namespace, response[i].Name) < resourceKey(response[j].Namespace, response[j].Name)
	})
	return response, nil
}

func getReplicaSetDeployments(ctx context.Context, clientset k8s.Interface) (replicaSetDeployments, error) {
	replicaSets, err := clientset.AppsV1().ReplicaSets("").List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	deployments := make(replicaSetDeployments, len(replicaSets.Items))
	for _, replicaSet := range replicaSets.Items {
		for _, owner := range replicaSet.OwnerReferences {
			if owner.Controller != nil && *owner.Controller && owner.Kind == "Deployment" {
				deployments[resourceKey(replicaSet.Namespace, replicaSet.Name)] = owner.Name
				break
			}
		}
	}
	return deployments, nil
}

func podDeployment(pod corev1.Pod, deployments replicaSetDeployments) string {
	for _, owner := range pod.OwnerReferences {
		if owner.Controller != nil && *owner.Controller && owner.Kind == "ReplicaSet" {
			return deployments[resourceKey(pod.Namespace, owner.Name)]
		}
	}
	return ""
}
