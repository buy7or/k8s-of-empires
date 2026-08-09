# K8s of Empires

3D Kubernetes cluster visualizer built with a static HTML/CSS/JavaScript frontend and a Go backend using `client-go`.

Current version: **v0.1.0**

## Architecture

```text
Browser
  ↓
Ingress
  ↓
Service (ClusterIP)
  ↓
Pod
  ├── Frontend
  └── Go API
        ↓
   Kubernetes API
```

The backend uses:

- Local development: `~/.kube/config`
- Inside Kubernetes: `InClusterConfig()` with a dedicated `ServiceAccount` and RBAC permissions

## Project structure

```text
k8s-of-empires/
├── backend/
│   ├── handlers/
│   ├── kubernetes/
│   ├── models/
│   ├── routes/
│   ├── go.mod
│   └── main.go
├── frontend/
├── k8s/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── rbac.yaml
├── Dockerfile
└── README.md
```

## API

Current endpoints include:

```text
GET /api/health
GET /api/cluster/health
GET /api/nodes
GET /api/pods
GET /api/namespaces
GET /api/deployments
```

## Run locally

From the backend directory:

```bash
go run .
```

The backend connects using:

```text
~/.kube/config
```

## Docker

Build the image:

```bash
docker build -t k8s-of-empires:local .
```

Run locally:

```bash
docker run --rm -p 8080:8080 \
  -v "$HOME/.kube/config:/root/.kube/config:ro" \
  k8s-of-empires:local
```

Open:

```text
http://localhost:8080
```

## Container image

The image is published to GitHub Container Registry:

```text
ghcr.io/buy7or/k8s-of-empires:v0.1.0
```

## Kubernetes deployment

The application runs with:

- `Deployment`
- `ClusterIP Service`
- `Ingress`
- `ServiceAccount`
- Read-only RBAC permissions for required Kubernetes resources

Apply the manifests:

```bash
kubectl apply -f k8s/rbac.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

## Versioning

Git tags and container tags follow semantic versioning:

```text
v0.1.0
```

Example:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Docker image:

```text
ghcr.io/buy7or/k8s-of-empires:v0.1.0
```

## Next step

Package the Kubernetes manifests as a Helm chart.
