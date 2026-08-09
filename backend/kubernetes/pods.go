package kubernetes

import (
	"context"

	"github.com/buy7or/k8s-of-empires/models"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	k8s "k8s.io/client-go/kubernetes"
)

func getPodsByNode(
	ctx context.Context,
	clientset k8s.Interface,
	deployments replicaSetDeployments,
) (map[string][]models.PodResponse, error) {
	pods, err := getPodResponses(ctx, clientset, deployments)
	if err != nil {
		return nil, err
	}

	podsByNode := make(map[string][]models.PodResponse)
	for _, pod := range pods {
		if pod.Node == "" {
			continue
		}
		podsByNode[pod.Node] = append(podsByNode[pod.Node], pod)
	}
	return podsByNode, nil
}

// GetPods returns every pod in the cluster as a flat resource list.
func GetPods(ctx context.Context, clientset k8s.Interface) ([]models.PodResponse, error) {
	deployments, err := getReplicaSetDeployments(ctx, clientset)
	if err != nil {
		return nil, err
	}
	return getPodResponses(ctx, clientset, deployments)
}

func getPodResponses(
	ctx context.Context,
	clientset k8s.Interface,
	deployments replicaSetDeployments,
) ([]models.PodResponse, error) {
	pods, err := clientset.CoreV1().Pods("").List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	response := make([]models.PodResponse, 0, len(pods.Items))
	for _, pod := range pods.Items {
		response = append(response, mapPod(pod, deployments))
	}
	sortPodsByNamespace(response)
	return response, nil
}

func mapPod(pod corev1.Pod, deployments replicaSetDeployments) models.PodResponse {
	status, reason := podStatus(pod)
	image := ""
	var port int32
	if len(pod.Spec.Containers) > 0 {
		image = pod.Spec.Containers[0].Image
		if len(pod.Spec.Containers[0].Ports) > 0 {
			port = pod.Spec.Containers[0].Ports[0].ContainerPort
		}
	}

	labels := pod.Labels
	if labels == nil {
		labels = map[string]string{}
	}

	return models.PodResponse{
		Name:       pod.Name,
		Deployment: podDeployment(pod, deployments),
		Namespace:  pod.Namespace,
		Node:       pod.Spec.NodeName,
		Containers: len(pod.Spec.Containers),
		Status:     status,
		Reason:     reason,
		Ready:      podReady(pod),
		Labels:     labels,
		Image:      image,
		Port:       port,
	}
}

func podReady(pod corev1.Pod) bool {
	for _, condition := range pod.Status.Conditions {
		if condition.Type == corev1.PodReady {
			return condition.Status == corev1.ConditionTrue
		}
	}
	return false
}

func podStatus(pod corev1.Pod) (string, string) {
	reason := podReason(pod)
	if pod.Status.Phase == corev1.PodFailed || pod.Status.Phase == corev1.PodUnknown || isErrorReason(reason) {
		if reason == "" {
			reason = string(pod.Status.Phase)
		}
		return "Error", reason
	}
	if pod.Status.Phase == corev1.PodRunning && podReady(pod) {
		return "Running", ""
	}
	if pod.Status.Phase == corev1.PodSucceeded {
		return "Running", reason
	}
	return "Pending", reason
}

func podReason(pod corev1.Pod) string {
	if pod.Status.Reason != "" {
		return pod.Status.Reason
	}

	statuses := append([]corev1.ContainerStatus{}, pod.Status.InitContainerStatuses...)
	statuses = append(statuses, pod.Status.ContainerStatuses...)
	for _, status := range statuses {
		if status.State.Waiting != nil && status.State.Waiting.Reason != "" {
			return status.State.Waiting.Reason
		}
		if status.State.Terminated != nil && status.State.Terminated.Reason != "Completed" {
			return status.State.Terminated.Reason
		}
	}
	return ""
}

func isErrorReason(reason string) bool {
	switch reason {
	case "CrashLoopBackOff", "ImagePullBackOff", "ErrImagePull", "CreateContainerConfigError",
		"CreateContainerError", "RunContainerError", "OOMKilled", "Error", "InvalidImageName",
		"ContainerCannotRun", "DeadlineExceeded", "Evicted":
		return true
	default:
		return false
	}
}
