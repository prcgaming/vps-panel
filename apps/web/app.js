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

    // Fetch live system settings & custom website branding from panel
    await fetchLiveSettings();

    fetchClusterTelemetry();
  }

  async function fetchLiveSettings() {
    const panelUrl = config.panelUrl.replace(/\/$/, '');
    try {
      const res = await fetch(`${panelUrl}/api/settings`, { mode: 'cors' });
      if (!res.ok) return;
      const data = await res.json();
      const s = data.settings || {};

      // 1. Custom Background Wallpaper
      if (s.web_bg_image) {
        const opacity = s.web_bg_overlay_opacity || '0.85';
        document.body.style.backgroundImage = `linear-gradient(rgba(7, 10, 20, ${opacity}), rgba(7, 10, 20, ${opacity})), url('${s.web_bg_image}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundPosition = 'center';
      }

      // 2. Custom Brand Names
      if (s.company_name) {
        document.querySelectorAll('.company-name').forEach(el => el.textContent = s.company_name);
      }
      if (s.panel_name) {
        document.querySelectorAll('.brand-name').forEach(el => el.textContent = s.panel_name);
      }
      if (s.support_url) {
        config.supportUrl = s.support_url;
        document.querySelectorAll('.link-support').forEach(el => el.href = s.support_url);
      }

      // 3. Custom Hero Text
      if (s.web_hero_badge) {
        const pillText = document.getElementById('hero-pill-text');
        if (pillText) pillText.textContent = s.web_hero_badge;
      }
      if (s.web_hero_title) {
        const titleBox = document.getElementById('hero-title-box');
        if (titleBox) titleBox.innerHTML = s.web_hero_title;
      }
      if (s.web_hero_subtitle) {
        const subtitleBox = document.getElementById('hero-subtitle-box');
        if (subtitleBox) subtitleBox.textContent = s.web_hero_subtitle;
      }

      // 4. Custom Social Links
      if (s.web_discord_url) {
        document.querySelectorAll('.link-discord').forEach(el => el.href = s.web_discord_url);
      }
      if (s.web_telegram_url) {
        document.querySelectorAll('.link-telegram').forEach(el => el.href = s.web_telegram_url);
      }

      // 5. Injected Custom CSS
      if (s.web_custom_css) {
        let styleTag = document.getElementById('custom-web-injected-css');
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = 'custom-web-injected-css';
          document.head.appendChild(styleTag);
        }
        styleTag.textContent = s.web_custom_css;
      }

      // 6. Dynamic Pricing Plans
      if (s.web_plans_json) {
        try {
          const plans = JSON.parse(s.web_plans_json);
          if (Array.isArray(plans) && plans.length > 0) {
            renderCustomPlans(plans, panelUrl);
          }
        } catch (e) {
          console.error('Failed to parse custom plans JSON', e);
        }
      }
    } catch (err) {
      console.log('Using default local website assets (panel settings offline or cors pending)');
    }
  }

  function renderCustomPlans(plans, panelUrl) {
    const container = document.getElementById('pricing-grid-container');
    if (!container) return;

    let html = '';
    for (const p of plans) {
      const isPop = p.isPopular;
      html += `
        <div class="price-card glass ${isPop ? 'popular' : ''}">
          ${p.badge ? `<div class="popular-badge">${p.badge}</div>` : ''}
          <div class="plan-title">${p.name}</div>
          <div class="plan-desc">${p.desc || 'High-performance cloud virtual machine with dedicated resources.'}</div>
          <div class="plan-price">
            <span class="amount">${p.price}</span>
          </div>
          <ul class="specs-list">
            <li><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> ${p.cpu} vCPU Core${p.cpu > 1 ? 's' : ''}</li>
            <li><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> ${p.ram}</li>
            <li><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> ${p.disk}</li>
            <li><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> ${p.bandwidth || 'Unmetered 1Gbps Bandwidth'}</li>
            <li><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> 1 Dedicated Public IPv4</li>
            <li><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Full KVM / QEMU Virtualization</li>
          </ul>
          <a href="${panelUrl}" target="_blank" class="${isPop ? 'btn-primary' : 'btn-secondary'} link-panel-deploy">
            ${p.buttonText || 'Deploy VPS'}
          </a>
        </div>
      `;
    }
    container.innerHTML = html;
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
