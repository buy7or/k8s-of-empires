package tests

import (
	"context"
	"testing"

	kubeservice "github.com/buy7or/k8s-of-empires/kubernetes"
	"k8s.io/client-go/kubernetes/fake"
)

func TestGetNodesBuildsFrontendResponse(t *testing.T) {
	nodes, err := kubeservice.GetNodes(context.Background(), fake.NewClientset(testObjects()...))
	if err != nil {
		t.Fatalf("GetNodes() error = %v", err)
	}
	if len(nodes) != 1 {
		t.Fatalf("GetNodes() returned %d nodes, want 1", len(nodes))
	}

	node := nodes[0]
	if node.Name != "node-a" || node.IP != "10.0.0.1" || !node.Ready || node.Status != "Ready" {
		t.Fatalf("unexpected node response: %+v", node)
	}
	if len(node.Pods) != 3 {
		t.Fatalf("GetNodes() returned %d pods, want 3", len(node.Pods))
	}

	pods := make(map[string]struct {
		status     string
		reason     string
		deployment string
	})
	for _, item := range node.Pods {
		pods[item.Name] = struct {
			status     string
			reason     string
			deployment string
		}{item.Status, item.Reason, item.Deployment}
	}

	assertPod(t, pods, "running", "Running", "", "web")
	assertPod(t, pods, "pending", "Pending", "ContainerCreating", "")
	assertPod(t, pods, "error", "Error", "CrashLoopBackOff", "")
}

func assertPod(
	t *testing.T,
	pods map[string]struct {
		status     string
		reason     string
		deployment string
	},
	name, status, reason, deployment string,
) {
	t.Helper()
	pod, ok := pods[name]
	if !ok {
		t.Fatalf("pod %q not found", name)
	}
	if pod.status != status || pod.reason != reason || pod.deployment != deployment {
		t.Fatalf("pod %q = %+v, want status=%q reason=%q deployment=%q", name, pod, status, reason, deployment)
	}
}
