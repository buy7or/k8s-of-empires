package tests

import (
	"context"
	"testing"

	kubeservice "github.com/buy7or/k8s-of-empires/kubernetes"
	"k8s.io/client-go/kubernetes/fake"
)

func TestGetDeploymentsReturnsReplicaState(t *testing.T) {
	deployments, err := kubeservice.GetDeployments(context.Background(), fake.NewClientset(testObjects()...))
	if err != nil {
		t.Fatalf("GetDeployments() error = %v", err)
	}
	if len(deployments) != 1 {
		t.Fatalf("GetDeployments() returned %d deployments, want 1", len(deployments))
	}

	deployment := deployments[0]
	if deployment.Name != "web" || deployment.Namespace != "frontend" ||
		deployment.Replicas != 3 || deployment.ReadyReplicas != 2 || deployment.AvailableReplicas != 2 {
		t.Fatalf("unexpected deployment response: %+v", deployment)
	}
}
