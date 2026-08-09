package tests

import (
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

func testObjects() []runtime.Object {
	controller := true
	return []runtime.Object{
		&corev1.Node{
			ObjectMeta: metav1.ObjectMeta{Name: "node-a"},
			Status: corev1.NodeStatus{
				Addresses:  []corev1.NodeAddress{{Type: corev1.NodeInternalIP, Address: "10.0.0.1"}},
				Conditions: []corev1.NodeCondition{{Type: corev1.NodeReady, Status: corev1.ConditionTrue}},
			},
		},
		&appsv1.Deployment{
			ObjectMeta: metav1.ObjectMeta{
				Name: "web", Namespace: "frontend", Labels: map[string]string{"app": "web"},
			},
			Status: appsv1.DeploymentStatus{Replicas: 3, ReadyReplicas: 2, AvailableReplicas: 2},
		},
		&appsv1.ReplicaSet{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "web-abc",
				Namespace: "frontend",
				OwnerReferences: []metav1.OwnerReference{{
					Kind: "Deployment", Name: "web", Controller: &controller,
				}},
			},
		},
		&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "backend"}, Status: corev1.NamespaceStatus{Phase: corev1.NamespaceActive}},
		&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "database"}, Status: corev1.NamespaceStatus{Phase: corev1.NamespaceActive}},
		&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "frontend", Labels: map[string]string{"team": "web"}}, Status: corev1.NamespaceStatus{Phase: corev1.NamespaceActive}},
		pod("running", "frontend", "node-a", corev1.PodRunning, true, "", "web-abc", &controller),
		pod("pending", "backend", "node-a", corev1.PodPending, false, "ContainerCreating", "", nil),
		pod("error", "database", "node-a", corev1.PodRunning, false, "CrashLoopBackOff", "", nil),
	}
}

func pod(
	name, namespace, nodeName string,
	phase corev1.PodPhase,
	ready bool,
	reason, replicaSet string,
	controller *bool,
) *corev1.Pod {
	conditionStatus := corev1.ConditionFalse
	if ready {
		conditionStatus = corev1.ConditionTrue
	}
	state := corev1.ContainerState{Running: &corev1.ContainerStateRunning{}}
	if reason != "" {
		state = corev1.ContainerState{Waiting: &corev1.ContainerStateWaiting{Reason: reason}}
	}
	var owners []metav1.OwnerReference
	if replicaSet != "" {
		owners = []metav1.OwnerReference{{Kind: "ReplicaSet", Name: replicaSet, Controller: controller}}
	}

	return &corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace, OwnerReferences: owners},
		Spec: corev1.PodSpec{
			NodeName: nodeName,
			Containers: []corev1.Container{{
				Name:  "app",
				Image: "example/app:1.0",
				Ports: []corev1.ContainerPort{{ContainerPort: 8080}},
			}},
		},
		Status: corev1.PodStatus{
			Phase:             phase,
			Conditions:        []corev1.PodCondition{{Type: corev1.PodReady, Status: conditionStatus}},
			ContainerStatuses: []corev1.ContainerStatus{{State: state}},
		},
	}
}
