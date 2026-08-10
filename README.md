# K8s of Empires

K8s of Empires is a 3D Kubernetes cluster visualizer with a static HTML/CSS/JavaScript frontend and a Go backend built with `client-go`.

It provides a visual overview of cluster resources such as nodes, pods, namespaces and deployments.

## Features

- 3D visualization of Kubernetes resources
- Real-time data from the Kubernetes API
- Nodes, pods, namespaces and deployments
- Cluster health checks
- Label and namespace filtering
- Read-only Kubernetes access through RBAC
- Single container image with frontend and backend

## Architecture

```text
Browser
  |
  v
Ingress/Gateway (not included here)
  |
  v
Service (ClusterIP)
  |
  v
K8s of Empires Pod
  |-- Frontend
  `-- Go API
        |
        v
   Kubernetes API
```

When running inside Kubernetes, the backend authenticates using `InClusterConfig()` and a dedicated `ServiceAccount`.

## Container Image

The official container image is available from GitHub Container Registry:

```text
ghcr.io/buy7or/k8s-of-empires:v0.1.0
```

## Kubernetes Installation

### Deploy

Clone the repository:

```bash
git clone https://github.com/buy7or/k8s-of-empires.git
cd k8s-of-empires
```

Apply the Kubernetes manifests:

```bash
kubectl apply -f k8s/rbac.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

Check the deployment:

```bash
kubectl get pods
kubectl get svc
```

## API

The backend exposes the following endpoints:

```text
GET /api/health
GET /api/cluster/health
GET /api/nodes
GET /api/pods
GET /api/namespaces
GET /api/deployments
```

## RBAC

K8s of Empires uses a dedicated `ServiceAccount` with read-only permissions for the Kubernetes resources required by the application.

The application does not require write permissions to the cluster.

## Local Development

The backend can also run outside Kubernetes using the local kubeconfig:

```text
~/.kube/config
```

Run the backend:

```bash
cd backend
go run .
```

## Docker

Build the image:

```bash
docker build -t k8s-of-empires:local .
```

Run locally with access to your kubeconfig:

```bash
docker run --rm   -p 8080:8080   -v "$HOME/.kube/config:/root/.kube/config:ro"   k8s-of-empires:local
```

Open:

```text
http://localhost:8080
```

## License

See the repository license for usage and distribution terms.
