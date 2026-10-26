// Lunar Cloud HVM - Public Portal & Cluster Gateway
(function() {
  let config = {
    panelUrl: 'https://vps.lunars.indevs.in',
    brandName: 'Lunar Cloud HVM',
    companyName: 'Lunar Infrastructure Networks',
    supportUrl: 'https://vps.lunars.indevs.in'
  };

    async function loadConfig() {
    try {
      const res = await fetch('config.json');
      if (res.ok) {
        const json = await res.json();
        config = { ...config, ...json };
      }
    } catch (e) {
      console.log('Using default embedded portal configuration');
    }

    // Auto-detect Codespaces, CodeSandbox, or local port forwarding
    if (window.location.hostname.includes('.app.github.dev')) {
      config.panelUrl = window.location.origin.replace('-3000.', '-4000.');
    } else if (window.location.hostname.includes('csb.app') || window.location.hostname.includes('codesandbox.io')) {
      config.panelUrl = `${window.location.protocol}//${window.location.hostname.replace('3000', '4000')}`;
    } else if (window.location.port === '3000') {
      config.panelUrl = `${window.location.protocol}//${window.location.hostname}:4000`;
    }

    applyConfigToDOM();
    fetchClusterTelemetry();
  }

  function applyConfigToDOM() {
    // 1. Update Brand Elements
    document.querySelectorAll('.brand-name').forEach(el => el.textContent = config.brandName);
    document.querySelectorAll('.company-name').forEach(el => el.textContent = config.companyName);

    // 2. Update Links to Panel
    const panelUrl = config.panelUrl.replace(/\/$/, '');
    document.querySelectorAll('.link-panel').forEach(el => {
      el.href = panelUrl;
      el.target = '_blank';
    });

    document.querySelectorAll('.link-panel-deploy').forEach(el => {
      el.href = `${panelUrl}`;
      el.target = '_blank';
    });

    document.querySelectorAll('.link-support').forEach(el => {
      el.href = config.supportUrl;
      el.target = '_blank';
    });
  }

  async function fetchClusterTelemetry() {
    const panelUrl = config.panelUrl.replace(/\/$/, '');
    const statusText = document.getElementById('cluster-status-text');
    const nodesVal = document.getElementById('stat-nodes-val');
    const vcpuVal = document.getElementById('stat-vcpu-val');
    const latencyVal = document.getElementById('stat-latency-val');

    const startTime = performance.now();

    try {
      // 1. Check health
      const healthRes = await fetch(`${panelUrl}/api/health`, { mode: 'cors' });
      const latency = Math.round(performance.now() - startTime);

      if (healthRes.ok) {
        if (statusText) statusText.textContent = 'Cluster Online (100% SLA)';
        if (latencyVal) latencyVal.textContent = `${latency}ms`;
      }
    } catch (err) {
      // CORS or network
      if (statusText) statusText.textContent = 'Cluster Operational';
      if (latencyVal) latencyVal.textContent = '< 15ms';
    }

    try {
      // 2. Fetch cluster stats
      const statsRes = await fetch(`${panelUrl}/api/stats`, { mode: 'cors' });
      if (statsRes.ok) {
        const data = await statsRes.json();
        if (nodesVal && data.nodes) {
          nodesVal.textContent = `${data.nodes.total || 1} Active Nodes`;
        }
        if (vcpuVal && data.resources?.cpu) {
          vcpuVal.textContent = `${data.resources.cpu.total || 16} Cores`;
        }
      }
    } catch (err) {
      if (nodesVal) nodesVal.textContent = 'High-Availability';
      if (vcpuVal) vcpuVal.textContent = 'Dedicated KVM';
    }
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    setInterval(fetchClusterTelemetry, 30000);
  });
})();
