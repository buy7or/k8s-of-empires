# K8s of Empires

Visualizador 3D de un clúster de Kubernetes.

## Backend

El backend está desarrollado en Go y se conecta al clúster de Kubernetes usando el kubeconfig local.

### Requisitos

- Go 1.22+
- Acceso a un clúster de Kubernetes
- Un kubeconfig válido en:

`~/.kube/config`

Puedes comprobar que tu configuración funciona ejecutando:

```bash
kubectl get nodes
```

## Estructura actual

```text
backend/
├── go.mod
├── go.sum
├── main.go
├── handlers/
│   ├── cluster.go
│   ├── deployments.go
│   ├── health.go
│   ├── namespaces.go
│   ├── nodes.go
│   ├── pods.go
│   └── responses.go
├── kubernetes/
│   ├── client.go
│   ├── deployments.go
│   ├── namespaces.go
│   ├── nodes.go
│   └── pods.go
├── models/
│   ├── cluster.go
│   ├── deployment.go
│   ├── health.go
│   ├── namespace.go
│   ├── node.go
│   └── pod.go
├── routes/
│   └── routes.go
└── tests/
    ├── deployments_test.go
    ├── fixtures_test.go
    ├── namespaces_test.go
    ├── nodes_test.go
    ├── pods_test.go
    └── routes_test.go
```

## Ejecutar el backend

Desde la carpeta `backend`:

```bash
go mod tidy
go run .
```

Por defecto, la API se ejecuta en:

`http://localhost:8080`

## Endpoints

### Health check del backend

Comprueba que el backend Go está funcionando.

```bash
curl http://localhost:8080/api/health
```

Respuesta esperada:

```json
{
  "status": "ok"
}
```

### Health check del clúster

Comprueba que el backend puede conectarse correctamente al API Server de Kubernetes.

```bash
curl http://localhost:8080/api/cluster/health
```

Respuesta esperada:

```json
{
  "cluster": "connected",
  "status": "ok"
}
```

### Recursos del clúster

Cada recurso dispone de su propio endpoint y atraviesa las capas `kubernetes`, `models` y `handlers`:

```bash
curl http://localhost:8080/api/nodes
curl http://localhost:8080/api/pods
curl http://localhost:8080/api/deployments
curl http://localhost:8080/api/namespaces
```

`/api/nodes` mantiene los pods anidados porque es el contrato utilizado por el visualizador. `/api/pods` ofrece además un listado plano para clientes técnicos.

## Conexión con Kubernetes

Durante el desarrollo local, el backend utiliza el kubeconfig del usuario:

`~/.kube/config`

El cliente de Kubernetes se crea usando `client-go`.

Más adelante, cuando la aplicación se ejecute dentro del propio clúster, la autenticación se realizará mediante un `ServiceAccount` y permisos RBAC en lugar de depender del kubeconfig local.
