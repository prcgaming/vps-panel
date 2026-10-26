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
      const res = await fetch('config.json?t=' + Date.now());
      if (res.ok) {
        const json = await res.json();
        config = { ...config, ...json };
      }
    } catch (e) {
      console.log('Using default embedded portal configuration');
    }

    // Auto-detect Codespaces, CodeSandbox, or local port forwarding
    const host = window.location.hostname;
    const proto = window.location.protocol;
    const port = window.location.port;

    if (host.includes('.app.github.dev')) {
      config.panelUrl = window.location.origin.replace('-3000.', '-4000.');
    } else if (host.includes('csb.app') || host.includes('codesandbox.io')) {
      config.panelUrl = `${proto}//${host.replace('3000', '4000')}`;
    } else if (port === '3000') {
      config.panelUrl = `${proto}//${host}:4000`;
    } else if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host === 'localhost' || host === '127.0.0.1') {
      // IP address without port or with standard port
      config.panelUrl = `${proto}//${host}:4000`;
    } else if (host && !host.startsWith('vps.') && config.panelUrl.includes('vps.lunars.indevs.in') && !host.includes('lunars.indevs.in')) {
      // Custom domain: default panel to vps.<domain>
      config.panelUrl = `${proto}//vps.${host}`;
    }

    applyConfigToDOM();

    // Fetch live system settings & custom website branding from panel or local settings.json
    await fetchLiveSettings();

    fetchClusterTelemetry();
  }

  async function fetchLiveSettings() {
    const panelUrl = config.panelUrl.replace(/\/$/, '');
    
    // Candidate sources for settings in priority order
    const candidateUrls = [
      'settings.json?t=' + Date.now(), // 1. Same-origin static file written by panel
      '/api/settings?t=' + Date.now(),  // 2. Same-origin API endpoint if reverse-proxied
      `${panelUrl}/api/settings?t=` + Date.now(), // 3. Linked panel API
      `${window.location.protocol}//${window.location.hostname}:4000/api/settings?t=` + Date.now() // 4. Direct port 4000
    ];

    let liveSettings = null;

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, { mode: 'cors' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.settings) {
            liveSettings = data.settings;
            break;
          }
        }
      } catch (err) {
        // Try next candidate
      }
    }

    if (!liveSettings) {
      console.log('Using default local website assets (no remote settings reachable)');
      return;
    }

    const s = liveSettings;

    // 1. Custom Background Wallpaper
    if (s.web_bg_image && s.web_bg_image.trim()) {
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

    // 6. Dynamic Pricing Plans (Supports custom deploy button link & removing all plans)
    if (s.web_plans_json !== undefined) {
      try {
        const plans = typeof s.web_plans_json === 'string' ? JSON.parse(s.web_plans_json) : s.web_plans_json;
        if (Array.isArray(plans)) {
          renderCustomPlans(plans, panelUrl);
        }
      } catch (e) {
        console.error('Failed to parse custom plans JSON', e);
      }
    }

    // 7. Premade Section Visibility Controls (Allows removing plans completely, etc.)
    applySectionVisibility(s);

    // 8. Custom Homepage Sections & Blocks
    renderCustomSections(s);

    // 9. WordPress-Style Custom Pages & Routing
    setupWordPressPages(s);
  }

  let customPagesMap = {};

  function parseMarkdown(text) {
    if (!text) return '';
    if (text.trim().startsWith('<') && text.trim().endsWith('>')) {
      return text;
    }
    let html = text
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>')
      .replace(/\n\s*\n/gim, '</p><p>');

    html = html.replace(/(<li>[\s\S]*?<\/li>)/gim, '<ul>$1</ul>');
    return `<p>${html}</p>`;
  }

  function applySectionVisibility(s) {
    // 1. Hero
    const heroEl = document.getElementById('hero');
    if (heroEl) {
      if (s.web_show_hero === '0') heroEl.classList.add('section-hidden');
      else heroEl.classList.remove('section-hidden');
    }

    // 2. Pricing Plans (Allows removing plans completely)
    const plansEl = document.getElementById('plans');
    const plansNav = document.querySelectorAll('[data-nav-target="plans"], [data-footer-target="plans"]');
    if (plansEl) {
      if (s.web_show_plans === '0') {
        plansEl.classList.add('section-hidden');
        plansNav.forEach(el => el.style.display = 'none');
      } else {
        plansEl.classList.remove('section-hidden');
        plansNav.forEach(el => el.style.display = '');
      }
    }

    // 3. Features
    const featuresEl = document.getElementById('features');
    const featuresNav = document.querySelectorAll('[data-nav-target="features"], [data-footer-target="features"]');
    if (featuresEl) {
      if (s.web_show_features === '0') {
        featuresEl.classList.add('section-hidden');
        featuresNav.forEach(el => el.style.display = 'none');
      } else {
        featuresEl.classList.remove('section-hidden');
        featuresNav.forEach(el => el.style.display = '');
      }
    }

    // 4. Cluster Monitor
    const monitorEl = document.getElementById('monitor');
    const monitorNav = document.querySelectorAll('[data-nav-target="monitor"]');
    if (monitorEl) {
      if (s.web_show_monitor === '0') {
        monitorEl.classList.add('section-hidden');
        monitorNav.forEach(el => el.style.display = 'none');
      } else {
        monitorEl.classList.remove('section-hidden');
        monitorNav.forEach(el => el.style.display = '');
      }
    }

    // 5. FAQ
    const faqEl = document.getElementById('faq');
    const faqNav = document.querySelectorAll('[data-nav-target="faq"]');
    if (faqEl) {
      if (s.web_show_faq === '0') {
        faqEl.classList.add('section-hidden');
        faqNav.forEach(el => el.style.display = 'none');
      } else {
        faqEl.classList.remove('section-hidden');
        faqNav.forEach(el => el.style.display = '');
      }
    }
  }

  function renderCustomSections(s) {
    const container = document.getElementById('custom-sections-container');
    if (!container) return;
    if (!s.web_custom_sections_json) {
      container.innerHTML = '';
      return;
    }

    try {
      const sections = typeof s.web_custom_sections_json === 'string'
        ? JSON.parse(s.web_custom_sections_json)
        : s.web_custom_sections_json;
      if (!Array.isArray(sections) || sections.length === 0) {
        container.innerHTML = '';
        return;
      }

      let html = '';
      for (const sec of sections) {
        if (sec.isPublished === false) continue;
        const slug = sec.id || (sec.title ? sec.title.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'sec');
        html += `
          <section class="section custom-section" id="section-${slug}">
            <div class="container">
              <div class="section-head">
                <h2>${sec.title || 'Custom Section'}</h2>
                ${sec.subtitle ? `<p>${sec.subtitle}</p>` : ''}
              </div>
              <div class="custom-section-box glass">
                ${parseMarkdown(sec.content || '')}
              </div>
            </div>
          </section>
        `;
      }
      container.innerHTML = html;
    } catch (e) {
      console.error('Failed to parse custom sections', e);
    }
  }

  function setupWordPressPages(s) {
    customPagesMap = {};
    if (!s.web_pages_json) return;

    try {
      const pages = typeof s.web_pages_json === 'string'
        ? JSON.parse(s.web_pages_json)
        : s.web_pages_json;
      if (!Array.isArray(pages)) return;

      const navList = document.getElementById('header-nav-links');
      const footerLinks = document.getElementById('footer-links');

      document.querySelectorAll('.injected-page-link').forEach(el => el.remove());

      for (const page of pages) {
        if (page.isPublished === false) continue;
        const slug = (page.slug || page.title.toLowerCase().replace(/[^a-z0-9]/g, '-')).replace(/^\/+/, '');
        customPagesMap[slug] = page;
        customPagesMap['/' + slug] = page;

        if (page.showInNav && navList) {
          const li = document.createElement('li');
          li.className = 'injected-page-link';
          li.innerHTML = `<a href="#${slug}">${page.title}</a>`;
          navList.appendChild(li);
        }

        if (page.showInFooter && footerLinks) {
          const a = document.createElement('a');
          a.className = 'injected-page-link';
          a.href = `#${slug}`;
          a.textContent = page.title;
          footerLinks.appendChild(a);
        }
      }

      handleRouter();
    } catch (e) {
      console.error('Failed to parse custom pages', e);
    }
  }

  function handleRouter() {
    const rawHash = (window.location.hash || '').replace(/^#\/?/, '').trim();
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('page');
    const slug = rawHash || pageParam;

    const homepageView = document.getElementById('homepage-view');
    const pageContainer = document.getElementById('custom-page-container');
    const pageTitle = document.getElementById('page-title');
    const pageMeta = document.getElementById('page-meta');
    const pageContent = document.getElementById('page-content');

    if (!pageContainer || !homepageView) return;

    const homeAnchors = ['features', 'plans', 'monitor', 'faq', 'hero', ''];

    if (slug && !homeAnchors.includes(slug) && customPagesMap[slug]) {
      const page = customPagesMap[slug];
      homepageView.style.display = 'none';
      pageContainer.style.display = 'block';

      if (pageTitle) pageTitle.textContent = page.title;
      if (pageMeta) {
        pageMeta.innerHTML = `
          <span>Updated: ${page.updatedAt || 'Recent'}</span>
          <span>&bull;</span>
          <span>${config.brandName || 'Cloud Portal'}</span>
        `;
      }
      if (pageContent) {
        pageContent.innerHTML = parseMarkdown(page.content || '');
      }

      document.title = `${page.title} - ${config.brandName || 'Lunar Cloud'}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      homepageView.style.display = '';
      pageContainer.style.display = 'none';
      document.title = `${config.brandName || 'Lunar Cloud HVM'} - Next-Gen Hardware Virtual Machines`;

      if (slug && homeAnchors.includes(slug)) {
        const target = document.getElementById(slug);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  window.addEventListener('hashchange', handleRouter);

  document.addEventListener('click', (e) => {
    const target = e.target.closest('#page-back-btn');
    if (target) {
      e.preventDefault();
      history.pushState('', document.title, window.location.pathname + window.location.search);
      window.location.hash = '';
      handleRouter();
    }
  });

  function renderCustomPlans(plans, panelUrl) {
    const container = document.getElementById('pricing-grid-container');
    if (!container) return;

    if (!plans || plans.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1.5rem; color: #94a3b8; font-size: 0.95rem; background: rgba(14, 20, 36, 0.6); border: 1px dashed rgba(255, 255, 255, 0.1); border-radius: 24px;">
          <div style="width: 52px; height: 52px; border-radius: 16px; background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.25); color: #06b6d4; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px;">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <p style="font-weight: 800; color: #fff; font-size: 1.15rem; margin-bottom: 6px;">Custom Cloud Compute on Demand</p>
          <p style="max-width: 480px; margin: 0 auto 20px; line-height: 1.6;">Dedicated virtual machines, high-memory KVM instances, and custom boot ISOs can be deployed directly from the Client Console.</p>
          <a href="${panelUrl}" target="_blank" class="btn-primary" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 26px; border-radius: 14px; font-weight: 700; font-size: 0.85rem; color: #fff; background: linear-gradient(135deg, #06b6d4, #2563eb); text-decoration: none; box-shadow: 0 10px 25px -5px rgba(6, 182, 212, 0.4);">
            <span>Access Client Console</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
      `;
      return;
    }

    let html = '';
    for (const p of plans) {
      const isPop = p.isPopular;
      const targetUrl = (p.buttonUrl && p.buttonUrl.trim()) ? p.buttonUrl.trim() : panelUrl;

      html += `
        <div class="price-card glass ${isPop ? 'popular' : ''}">
          ${p.badge ? `<div class="popular-badge">${p.badge}</div>` : ''}
          <div class="plan-title">${p.name}</div>
          <div class="plan-desc">${p.desc || 'High-performance cloud virtual machine with dedicated hardware resources.'}</div>
          <div class="plan-price">
            <span class="amount">${p.price}</span>
          </div>
          <ul class="specs-list">
            <li><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> ${p.cpu} Dedicated vCPU${p.cpu > 1 ? 's' : ''}</li>
            <li><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> ${p.ram}</li>
            <li><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> ${p.disk}</li>
            <li><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> ${p.bandwidth || 'Unmetered 1Gbps Bandwidth'}</li>
            <li><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> 1 Dedicated Public IPv4</li>
            <li><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Full KVM / QEMU Virtualization</li>
          </ul>
          <a href="${targetUrl}" target="_blank" ${(p.buttonUrl && p.buttonUrl.trim()) ? 'data-custom-url="true"' : ''} class="${isPop ? 'btn-primary' : 'btn-secondary'} link-panel-deploy">
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

    document.querySelectorAll('.link-panel-deploy:not([data-custom-url])').forEach(el => {
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
