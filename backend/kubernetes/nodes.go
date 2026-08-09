package kubernetes

import (
	"context"
	"sort"

	"github.com/buy7or/k8s-of-empires/models"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	k8s "k8s.io/client-go/kubernetes"
)

// GetNodes returns the node-oriented representation consumed by the frontend.
func GetNodes(ctx context.Context, clientset k8s.Interface) ([]models.NodeResponse, error) {
	nodes, err := clientset.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	deployments, err := getReplicaSetDeployments(ctx, clientset)
	if err != nil {
		return nil, err
	}

	podsByNode, err := getPodsByNode(ctx, clientset, deployments)
	if err != nil {
		return nil, err
	}

	response := make([]models.NodeResponse, 0, len(nodes.Items))
	for _, node := range nodes.Items {
		ready := nodeReady(node)
		nodePods := podsByNode[node.Name]
		if nodePods == nil {
			nodePods = []models.PodResponse{}
		}
		sortPodsByNamespace(nodePods)

		response = append(response, models.NodeResponse{
			Name:   node.Name,
			IP:     nodeInternalIP(node),
			Ready:  ready,
			Status: nodeStatus(ready),
			Pods:   nodePods,
		})
	}

	sort.Slice(response, func(i, j int) bool { return response[i].Name < response[j].Name })
	return response, nil
}

func nodeInternalIP(node corev1.Node) string {
	for _, address := range node.Status.Addresses {
		if address.Type == corev1.NodeInternalIP {
			return address.Address
		}
	}
	return ""
}

func nodeReady(node corev1.Node) bool {
	for _, condition := range node.Status.Conditions {
		if condition.Type == corev1.NodeReady {
			return condition.Status == corev1.ConditionTrue
		}
	}
	return false
}

func nodeStatus(ready bool) string {
	if ready {
		return "Ready"
	}
	return "Not Ready"
}
