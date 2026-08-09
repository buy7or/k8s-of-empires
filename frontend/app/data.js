let podSeq = 0;

function pod(name, ns, containers = 1, status = 'Running', reason = null, labels = {}) {
  const podName = name || `pod-${++podSeq}`;
  const tierByNamespace = {
    frontend: 'frontend',
    backend: 'backend',
    database: 'data',
    monitoring: 'observability',
    'kube-system': 'platform',
    default: 'services'
  };
  return {
    name: podName,
    deployment: podName,
    ns,
    containers,
    status,
    reason,
    ready: status === 'Running',
    labels: {
      app: podName,
      tier: tierByNamespace[ns] || 'services',
      'app.kubernetes.io/managed-by': 'k8s-of-empires',
      ...labels
    },
    image: 'nginx:1.27',
    port: 8080
  };
}

const nodeData = [
  { name: 'node-01', ip: '10.0.1.11', pods: [
    pod('api-gateway', 'default', 2),
    pod('auth-service', 'default', 1, 'Pending', 'ContainerCreating'),
    pod('worker-queue', 'backend', 2, 'Error', 'CrashLoopBackOff')
  ] },
  { name: 'node-02', ip: '10.0.1.12', pods: [
    pod('web-frontend', 'frontend', 1), pod('web-static', 'frontend', 1),
    pod('coredns', 'kube-system', 1),
    pod('postgres', 'database', 2, 'Pending', 'PodInitializing'),
    pod('order-api', 'backend', 2)
  ] },
  { name: 'node-03', ip: '10.0.1.13', pods: [
    pod('cdn-edge', 'default', 1),
    pod('grafana', 'monitoring', 2, 'Error', 'ImagePullBackOff'),
    pod('checkout-ui', 'frontend', 1),
    pod('redis-cache', 'database', 1, 'Error', 'OOMKilled')
  ] },
  { name: 'node-04', ip: '10.0.1.14', pods: [
    pod('api-gateway', 'default', 2),
    pod('auth-service', 'default', 1, 'Pending', 'Scheduling'),
    pod('worker-queue', 'backend', 2)
  ] }
];
