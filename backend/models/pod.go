package models

type PodResponse struct {
	Name       string            `json:"name"`
	Deployment string            `json:"deployment,omitempty"`
	Namespace  string            `json:"ns"`
	Node       string            `json:"node,omitempty"`
	Containers int               `json:"containers"`
	Status     string            `json:"status"`
	Reason     string            `json:"reason,omitempty"`
	Ready      bool              `json:"ready"`
	Labels     map[string]string `json:"labels"`
	Image      string            `json:"image"`
	Port       int32             `json:"port"`
}
