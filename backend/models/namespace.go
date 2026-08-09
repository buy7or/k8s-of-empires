package models

type NamespaceResponse struct {
	Name   string            `json:"name"`
	Status string            `json:"status"`
	Labels map[string]string `json:"labels"`
}
