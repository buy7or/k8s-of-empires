package models

type NodeResponse struct {
	Name   string        `json:"name"`
	IP     string        `json:"ip"`
	Ready  bool          `json:"ready"`
	Status string        `json:"status"`
	Pods   []PodResponse `json:"pods"`
}
