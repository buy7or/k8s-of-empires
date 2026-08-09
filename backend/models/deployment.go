package models

type DeploymentResponse struct {
	Name              string            `json:"name"`
	Namespace         string            `json:"namespace"`
	Replicas          int32             `json:"replicas"`
	ReadyReplicas     int32             `json:"readyReplicas"`
	AvailableReplicas int32             `json:"availableReplicas"`
	Labels            map[string]string `json:"labels"`
}
