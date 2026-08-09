package tests

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/buy7or/k8s-of-empires/routes"
	"k8s.io/client-go/kubernetes/fake"
)

func TestResourceRoutes(t *testing.T) {
	router := routes.New(fake.NewClientset(testObjects()...))

	for _, path := range []string{"/api/nodes", "/api/pods", "/api/deployments", "/api/namespaces"} {
		t.Run(path, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodGet, path, nil)
			response := httptest.NewRecorder()
			router.ServeHTTP(response, request)

			if response.Code != http.StatusOK {
				t.Fatalf("GET %s returned HTTP %d: %s", path, response.Code, response.Body.String())
			}
			if response.Header().Get("Content-Type") != "application/json" {
				t.Fatalf("GET %s returned content type %q", path, response.Header().Get("Content-Type"))
			}
		})
	}
}
