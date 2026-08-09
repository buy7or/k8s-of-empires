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
│   ├── health.go
│   └── cluster.go
├── kubernetes/
│   └── client.go
└── routes/
    └── routes.go
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

## Conexión con Kubernetes

Durante el desarrollo local, el backend utiliza el kubeconfig del usuario:

`~/.kube/config`

El cliente de Kubernetes se crea usando `client-go`.

Más adelante, cuando la aplicación se ejecute dentro del propio clúster, la autenticación se realizará mediante un `ServiceAccount` y permisos RBAC en lugar de depender del kubeconfig local.
