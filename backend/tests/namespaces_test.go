package tests

import (
	"context"
	"testing"

	kubeservice "github.com/buy7or/k8s-of-empires/kubernetes"
	"k8s.io/client-go/kubernetes/fake"
)

func TestGetNamespacesReturnsSortedResources(t *testing.T) {
	namespaces, err := kubeservice.GetNamespaces(context.Background(), fake.NewClientset(testObjects()...))
	if err != nil {
		t.Fatalf("GetNamespaces() error = %v", err)
	}
	if len(namespaces) != 3 {
		t.Fatalf("GetNamespaces() returned %d namespaces, want 3", len(namespaces))
	}
	if namespaces[0].Name != "backend" || namespaces[1].Name != "database" || namespaces[2].Name != "frontend" {
		t.Fatalf("namespaces are not sorted: %+v", namespaces)
	}
	if namespaces[2].Status != "Active" || namespaces[2].Labels["team"] != "web" {
		t.Fatalf("unexpected frontend namespace: %+v", namespaces[2])
	}
}
