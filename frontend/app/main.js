animate();

async function refreshClusterData() {
  await loadNodeData();
  buildWorld();
}

async function startApp() {
  setClusterLoading(true);
  try {
    await refreshClusterData();
  } catch (error) {
    showClusterLoadError(error);
  } finally {
    setClusterLoading(false);
  }
}

startApp();
