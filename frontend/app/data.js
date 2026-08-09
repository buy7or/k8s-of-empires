const nodeData = [];
const apiBaseUrl = (
  document.querySelector('meta[name="k8s-api-base-url"]')?.content
  || ''
).replace(/\/$/, '');

async function loadNodeData() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${apiBaseUrl}/api/nodes`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`The cluster API returned HTTP ${response.status}`);

    const payload = await response.json();
    if (!Array.isArray(payload)) throw new Error('The cluster API returned an invalid node list');

    const nodes = payload.map(node => ({
      name: String(node.name || 'Unnamed node'),
      ip: String(node.ip || '—'),
      ready: Boolean(node.ready),
      status: String(node.status || (node.ready ? 'Ready' : 'Not Ready')),
      pods: Array.isArray(node.pods) ? node.pods.map(pod => ({
        name: String(pod.name || 'Unnamed pod'),
        deployment: String(pod.deployment || ''),
        ns: String(pod.ns || 'default'),
        containers: Number(pod.containers) || 0,
        status: ['Running', 'Pending', 'Error'].includes(pod.status) ? pod.status : 'Pending',
        reason: pod.reason ? String(pod.reason) : null,
        ready: Boolean(pod.ready),
        labels: pod.labels && typeof pod.labels === 'object' ? pod.labels : {},
        image: String(pod.image || '—'),
        port: Number(pod.port) || 0
      })) : []
    }));

    nodeData.splice(0, nodeData.length, ...nodes);
    return nodeData;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The cluster API did not respond in time');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
