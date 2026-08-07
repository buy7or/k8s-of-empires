/* ---------------- UI ---------------- */
function visibilityIcon(visible) {
  return visible
    ? `<svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/>
        <circle cx="12" cy="12" r="2.7"/>
      </svg>`
    : `<svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 3l18 18"/>
        <path d="M10.6 6.1A10 10 0 0 1 12 6c6 0 9.5 6 9.5 6a15 15 0 0 1-2.1 2.8M6.2 6.2C3.8 8 2.5 12 2.5 12s3.5 6 9.5 6a9.8 9.8 0 0 0 3-.5M9.9 9.9a3 3 0 0 0 4.2 4.2"/>
      </svg>`;
}

const clusterCard = document.getElementById('clusterCard');
const clusterToggle = document.getElementById('clusterToggle');
clusterToggle?.addEventListener('click', () => {
  const expanded = clusterToggle.getAttribute('aria-expanded') !== 'true';
  clusterToggle.setAttribute('aria-expanded', String(expanded));
  clusterToggle.setAttribute('aria-label', `${expanded ? 'Ocultar' : 'Mostrar'} información del clúster`);
  clusterToggle.title = clusterToggle.getAttribute('aria-label');
  clusterCard?.classList.toggle('is-expanded', expanded);
});

function resourceStatus(pods) {
  if (pods.some(p => p.status === 'Error')) return 'Error';
  if (pods.some(p => p.status === 'Pending')) return 'Pending';
  return 'Running';
}

function technicalDetails(label, badge, className = 'technical-item') {
  const details = document.createElement('details');
  details.className = className;
  const summary = document.createElement('summary');
  const name = document.createElement('span');
  name.textContent = label;
  const count = document.createElement('span');
  count.className = 'technical-count';
  count.textContent = badge;
  summary.append(name, count);
  details.appendChild(summary);
  return details;
}

function technicalMeta(entries) {
  const meta = document.createElement('div');
  meta.className = 'technical-meta';
  entries.forEach(([label, value]) => {
    const item = document.createElement('span');
    const key = document.createElement('b');
    key.textContent = `${label}: `;
    item.append(key, String(value));
    meta.appendChild(item);
  });
  return meta;
}

function technicalPodRow(podData, node) {
  const row = document.createElement('div');
  row.className = 'technical-pod-row';

  const name = document.createElement('span');
  name.className = 'technical-pod-name';
  name.textContent = podData.name;
  if (podData.reason) {
    const reason = document.createElement('small');
    reason.textContent = podData.reason;
    name.appendChild(reason);
  }

  const nodeName = document.createElement('span');
  nodeName.className = 'technical-pod-node';
  nodeName.textContent = node.name;

  const state = document.createElement('span');
  state.className = `technical-pod-state status-${podData.status.toLowerCase()}`;
  state.innerHTML = '<i></i>';
  state.append(podData.status);
  row.append(name, nodeName, state);
  return row;
}

function deploymentDetails(deployment) {
  const pods = deployment.entries.map(entry => entry.pod);
  const status = resourceStatus(pods);
  const details = technicalDetails(deployment.name, status);
  const badge = details.querySelector('.technical-count');
  badge.className = `technical-status status-${status.toLowerCase()}`;
  const body = document.createElement('div');
  body.className = 'technical-item-body';
  const images = [...new Set(pods.map(p => p.image))];
  body.appendChild(technicalMeta([
    ['Namespace', deployment.namespace],
    ['Pods', pods.length],
    ['Ready', `${pods.filter(p => p.ready).length}/${pods.length}`],
    ['Containers', pods.reduce((total, p) => total + p.containers, 0)],
    ['Images', images.join(', ')]
  ]));
  const podList = document.createElement('div');
  podList.className = 'technical-pods';
  deployment.entries.forEach(entry => podList.appendChild(technicalPodRow(entry.pod, entry.node)));
  body.appendChild(podList);
  details.appendChild(body);
  return details;
}

function renderClusterExplorer() {
  const explorer = document.getElementById('clusterExplorer');
  if (!explorer) return;
  explorer.innerHTML = '';

  const deployments = new Map();
  nodeData.forEach(node => node.pods.forEach(podData => {
    const key = `${podData.ns}/${podData.deployment}`;
    if (!deployments.has(key)) {
      deployments.set(key, { name: podData.deployment, namespace: podData.ns, entries: [] });
    }
    deployments.get(key).entries.push({ pod: podData, node });
  }));
  const deploymentList = [...deployments.values()].sort((a, b) => a.name.localeCompare(b.name));

  const nodesGroup = technicalDetails('Nodes', nodeData.length, 'technical-group');
  const nodesChildren = document.createElement('div');
  nodesChildren.className = 'technical-children';
  nodeData.forEach(node => {
    const item = technicalDetails(node.name, 'Ready');
    const body = document.createElement('div');
    body.className = 'technical-item-body';
    body.appendChild(technicalMeta([
      ['IP', node.ip],
      ['Pods', node.pods.length],
      ['Deployments', new Set(node.pods.map(p => p.deployment)).size],
      ['Containers', node.pods.reduce((total, p) => total + p.containers, 0)]
    ]));
    const podList = document.createElement('div');
    podList.className = 'technical-pods';
    node.pods.forEach(podData => podList.appendChild(technicalPodRow(podData, node)));
    body.appendChild(podList);
    item.appendChild(body);
    nodesChildren.appendChild(item);
  });
  nodesGroup.appendChild(nodesChildren);

  const deploymentsGroup = technicalDetails('Deployments', deploymentList.length, 'technical-group');
  const deploymentsChildren = document.createElement('div');
  deploymentsChildren.className = 'technical-children';
  deploymentList.forEach(deployment => deploymentsChildren.appendChild(deploymentDetails(deployment)));
  deploymentsGroup.appendChild(deploymentsChildren);

  const namespaces = [...new Set(nodeData.flatMap(node => node.pods.map(p => p.ns)))].sort();
  const namespacesGroup = technicalDetails('Namespaces', namespaces.length, 'technical-group');
  const namespacesChildren = document.createElement('div');
  namespacesChildren.className = 'technical-children';
  namespaces.forEach(namespace => {
    const namespaceDeployments = deploymentList.filter(deployment => deployment.namespace === namespace);
    const podCount = namespaceDeployments.reduce((total, deployment) => total + deployment.entries.length, 0);
    const item = technicalDetails(namespace, `${podCount} pods`);
    const body = document.createElement('div');
    body.className = 'technical-item-body';
    body.appendChild(technicalMeta([
      ['Deployments', namespaceDeployments.length],
      ['Nodes', new Set(namespaceDeployments.flatMap(d => d.entries.map(entry => entry.node.name))).size]
    ]));
    const nested = document.createElement('div');
    nested.className = 'technical-pods';
    namespaceDeployments.forEach(deployment => nested.appendChild(deploymentDetails(deployment)));
    body.appendChild(nested);
    item.appendChild(body);
    namespacesChildren.appendChild(item);
  });
  namespacesGroup.appendChild(namespacesChildren);

  explorer.append(nodesGroup, deploymentsGroup, namespacesGroup);
}

function refreshUI() {
  const pods = nodeData.reduce((a, n) => a + n.pods.length, 0);
  const containers = nodeData.reduce((a, n) => a + n.pods.reduce((b, p) => b + p.containers, 0), 0);
  const deployments = new Set(nodeData.flatMap(n => n.pods.map(p => p.deployment))).size;
  const statusCounts = { Running: 0, Pending: 0, Error: 0 };
  const nss = new Set();
  nodeData.forEach(n => n.pods.forEach(p => {
    nss.add(p.ns);
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  }));

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('statPods', pods);
  set('statNodes', nodeData.length);
  set('statNamespaces', nss.size);
  set('statDeployments', deployments);
  renderClusterExplorer();

  const degraded = statusCounts.Error > 0;
  const waiting = !degraded && statusCounts.Pending > 0;
  const healthText = degraded ? 'Degraded' : waiting ? 'Pending' : 'Healthy';
  set('statStatus', healthText);
  document.getElementById('statStatus')?.classList.toggle('degraded', degraded);
  document.getElementById('statStatusIcon')?.classList.toggle('degraded', degraded);

  const legend = document.getElementById('namespaceLegend');
  if (legend) {
    legend.innerHTML = '';
    Object.keys(NAMESPACES).forEach(ns => {
      if (!nss.has(ns)) return;
      const hex = '#' + NAMESPACES[ns].toString(16).padStart(6, '0');
      const d = document.createElement('div');
      d.className = 'namespace-item';
      d.innerHTML = `<span class="namespace-dot" style="background:${hex}"></span><span class="namespace-name">${ns}</span>`;

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'namespace-toggle';

      const syncToggle = () => {
        const visible = isNamespaceVisible(ns);
        toggle.innerHTML = visibilityIcon(visible);
        toggle.title = `${visible ? 'Ocultar' : 'Mostrar'} namespace ${ns}`;
        toggle.setAttribute('aria-label', toggle.title);
        toggle.setAttribute('aria-pressed', String(!visible));
        d.classList.toggle('is-hidden', !visible);
      };

      toggle.addEventListener('click', () => {
        setNamespaceVisibility(ns, !isNamespaceVisible(ns));
        syncToggle();
      });

      syncToggle();
      d.appendChild(toggle);
      legend.appendChild(d);
    });
  }

  const statusFilters = document.getElementById('podStatusFilters');
  if (statusFilters) {
    statusFilters.innerHTML = '';
    ['Running', 'Pending', 'Error'].forEach(status => {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = `status-filter status-${status.toLowerCase()}`;

      const syncToggle = () => {
        const visible = isPodStatusVisible(status);
        toggle.innerHTML = `
          <span class="status-filter-dot"></span>
          <span class="status-filter-label">${status}</span>
          <span class="status-filter-count">${statusCounts[status]}</span>
          <span class="status-filter-eye">${visibilityIcon(visible)}</span>`;
        toggle.title = `${visible ? 'Ocultar' : 'Mostrar'} pods ${status}`;
        toggle.setAttribute('aria-label', toggle.title);
        toggle.setAttribute('aria-pressed', String(!visible));
        toggle.classList.toggle('is-hidden', !visible);
      };

      toggle.addEventListener('click', () => {
        setPodStatusVisibility(status, !isPodStatusVisible(status));
        syncToggle();
      });

      syncToggle();
      statusFilters.appendChild(toggle);
    });
  }
}

const infoPanel = document.getElementById('infoPanel');
const infoKind = document.getElementById('infoKind');
const infoTitle = document.getElementById('infoTitle');
const infoRows = document.getElementById('infoRows');
document.getElementById('closeInfo')?.addEventListener('click', () => infoPanel.classList.remove('show'));

function hideInfo() {
  infoPanel?.classList.remove('show');
}

function showInfo(pick) {
  if (!infoPanel) return;
  infoRows.innerHTML = '';
  const row = (k, v) => {
    const d = document.createElement('div');
    d.className = 'info-row';
    d.innerHTML = `<span>${k}</span><span>${v}</span>`;
    infoRows.appendChild(d);
  };

  if (pick.type === 'pod') {
    const p = pick.pod;
    infoKind.textContent = 'Pod';
    infoTitle.textContent = p.name;
    row('Estado', p.status);
    row('Ready', p.ready ? 'Sí' : 'No');
    if (p.reason) row('Detalle', p.reason);
    row('Deployment', p.deployment);
    row('Namespace', p.ns);
    row('Contenedores', p.containers);
    row('Imagen', p.image);
    row('Puerto', ':' + p.port);
    const owner = nodeData.find(n => n.pods.includes(p));
    row('Nodo', owner ? owner.name : '—');
  } else if (pick.type === 'namespace') {
    infoKind.textContent = 'Namespace';
    infoTitle.textContent = pick.ns;
    row('En el nodo', pick.node.name);
    row('Pods aquí', pick.count);
    const total = nodeData.reduce((a, n) => a + n.pods.filter(p => p.ns === pick.ns).length, 0);
    row('Pods totales', total);
    row('Nodos', nodeData.filter(n => n.pods.some(p => p.ns === pick.ns)).length);
  } else if (pick.type === 'node') {
    const n = pick.node;
    infoKind.textContent = 'Nodo';
    infoTitle.textContent = n.name;
    row('IP', n.ip);
    row('Pods', n.pods.length);
    row('Namespaces', new Set(n.pods.map(p => p.ns)).size);
    row('Contenedores', n.pods.reduce((a, p) => a + p.containers, 0));
    row('Estado', 'Ready');
  }
  infoPanel.classList.add('show');
}
