package models

type ClusterHealthResponse struct {
	Status  string `json:"status"`
	Cluster string `json:"cluster"`
}
