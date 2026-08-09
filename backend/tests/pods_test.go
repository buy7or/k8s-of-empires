package tests

import (
	"context"
	"testing"

	kubeservice "github.com/buy7or/k8s-of-empires/kubernetes"
	"k8s.io/client-go/kubernetes/fake"
)

func TestGetPodsReturnsFlatResources(t *testing.T) {
	pods, err := kubeservice.GetPods(context.Background(), fake.NewClientset(testObjects()...))
	if err != nil {
		t.Fatalf("GetPods() error = %v", err)
	}
	if len(pods) != 3 {
		t.Fatalf("GetPods() returned %d pods, want 3", len(pods))
	}

	for _, pod := range pods {
		if pod.Node != "node-a" {
			t.Fatalf("pod %q node = %q, want node-a", pod.Name, pod.Node)
		}
	}
}
