import { format, sum } from 'd3';
import { CONFIG, METRIC_FORMAT, STATE } from './config.js';
import { CountrySelector } from './countrySelector.js';
import { DataLoader } from './dataLoader.js';
import { TradeMap } from './map.js';
import { RegionConfig } from './regions.js';

import './../../../styles/custom/styles.css';

const FLOW_DEFAULTS = ['north-south', 'south-north', 'south-south', 'north-north'];

// Maps flow category key → CSS class (defines --flow-color custom property)
const FC = {
  'north-south': 'flow-ns',
  'south-north': 'flow-sn',
  'south-south': 'flow-ss',
  'north-north': 'flow-nn'
};
const CAT_LABELS_FULL = {
  'north-south': 'North → South',
  'south-north': 'South → North',
  'south-south': 'South → South',
  'north-north': 'North → North'
};
const CAT_LABELS_ARROW = {
  'north-south': 'North→South',
  'south-north': 'South→North',
  'south-south': 'South→South',
  'north-north': 'North→North'
};
const CAT_LABELS_SHORT = {
  'north-south': 'N→S',
  'south-north': 'S→N',
  'south-south': 'S→S',
  'north-north': 'N→N'
};

// Helper: app root element. Use as `const root = getRoot()`.
const getRoot = () => window.appRef.current;
// Helper: scoped querySelector
const qs = sel => window.appRef.current.querySelector(sel);
const qsa = sel => window.appRef.current.querySelectorAll(sel);

const App = {
  exporterSelector: null,
  importerSelector: null,
  _lastRenderedRegion: null,
  _globalRankCache: {},
  _resizeTimer: null,
  _prevSelectionCount: 0,

  async init() {
    STATE.selectedImporters = new Set();
    if (!STATE.flowFilters) STATE.flowFilters = new Set(FLOW_DEFAULTS);

    for (const el of qsa('.flow-checkbox')) {
      el.checked = true;
    }
    STATE.region = 'Global';

    const success = await DataLoader.loadAll();
    if (!success) return;

    this.exporterSelector = new CountrySelector('exp', 'exp-label', 'exporter');
    this.importerSelector = new CountrySelector('imp', 'imp-label', 'importer');

    try {
      await this.exporterSelector.init();
      await this.importerSelector.init();
    } catch (error) {
      console.error('Failed to initialize country selectors:', error);
      alert('Failed to initialize country selectors. Check the console for details.');
      return;
    }

    TradeMap.init();
    this.setupEventListeners();

    this.exporterSelector.updateSelection();
    this.updateDashboard();
    qs('.loader').classList.add('hidden');
  },

  changeFlowDirection(e) {
    const val = e.target.value;
    if (e.target.checked) {
      STATE.flowFilters.add(val);
    } else {
      STATE.flowFilters.delete(val);
    }
    clearTimeout(this._filterDebounce);
    this._filterDebounce = setTimeout(() => {
      this.updateDashboard(false);
    }, 50);
  },

  setupEventListeners() {
    const root = getRoot();

    // Region buttons
    qsa('.region-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        STATE.region = e.target.dataset.region;
        this.updateUIClasses('.region-btn', e.target);
        this.exporterSelector.setCountries([]);
        this.importerSelector.setCountries([]);
        this.updateDashboard();
      });
    });

    // Year select
    const yearSelect = qs('.year-select');
    if (yearSelect) {
      yearSelect.addEventListener('change', async e => {
        const year = +e.target.value;
        const loader = qs('.loader');
        loader.classList.remove('hidden');
        try {
          await DataLoader.loadYear(year);
          STATE.year = year;
          this.exporterSelector.setCountries([]);
          this.importerSelector.setCountries([]);
          this.updateDashboard();
        } catch (err) {
          console.error('Failed to load year data:', err);
        } finally {
          loader.classList.add('hidden');
        }
      });
    }

    // Threshold toggle
    qsa('.threshold-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const val = e.target.dataset.threshold;
        STATE.thresholdMode = val === 'auto' ? 'auto' : +val;
        this.updateUIClasses('.threshold-btn', e.target);
        // 50ms debounce: prevents overlapping D3 transitions when buttons are clicked rapidly
        clearTimeout(this._filterDebounce);
        this._filterDebounce = setTimeout(() => this.updateDashboard(false), 50);
      });
    });

    // Country picker dropdowns
    this.setupHierarchicalDropdown('exp', this.exporterSelector);
    this.setupHierarchicalDropdown('imp', this.importerSelector);

    // Insight panel close button
    qs('.panel-close-btn')?.addEventListener('click', () => this.closeInsightPanel());

    // Sea Route toggle button
    qs('.searoute-btn')?.addEventListener('click', () => {
      TradeMap?.toggleSeaRoute?.();
    });
    root.addEventListener('shc:searoute-toggled', e => {
      qs('.searoute-btn')?.classList.toggle('active', e.detail.active);
    });

    // Mobile legend toggle
    qs('.mobile-legend-btn')?.addEventListener('click', () => this.toggleMobileLegend());
    qs('.mobile-legend-backdrop')?.addEventListener('click', () => this.toggleMobileLegend());
    qs('.mobile-legend-close')?.addEventListener('click', () => this.toggleMobileLegend());

    // Arc detail modal
    qs('.arc-modal-close')?.addEventListener('click', () => this.closeArcModal());
    qs('.arc-modal-backdrop')?.addEventListener('click', () => this.closeArcModal());

    // Compare modal
    qs('.compare-modal-close')?.addEventListener('click', () => this.closeCompareModal());
    qs('.compare-modal-backdrop')?.addEventListener('click', () => this.closeCompareModal());

    // Methodology modal
    qs('.methodology-btn')?.addEventListener('click', () => this.openMethodologyModal());
    qs('.methodology-modal-close')?.addEventListener('click', () => this.closeMethodologyModal());
    qs('.methodology-modal-backdrop')?.addEventListener('click', () => this.closeMethodologyModal());

    // Escape key closes any open modal
    root.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (!qs('.arc-modal').classList.contains('hidden')) this.closeArcModal();
      if (!qs('.compare-modal').classList.contains('hidden')) this.closeCompareModal();
      if (!qs('.methodology-modal').classList.contains('hidden')) this.closeMethodologyModal();
    });

    // CSS variable to compensate for the URL-bar viewport shift on mobile browsers
    const setMobileHeight = () => {
      const vh = window.innerHeight * 0.01;
      root.style.setProperty('--vh', `${vh}px`);
    };
    setMobileHeight();

    const redrawMap = () => {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => {
        TradeMap.init();
        TradeMap.renderFlows();
      }, 200);
    };

    this._resizeHandler = () => {
      setMobileHeight();
      redrawMap();
    };
    this._appRoot = root;

    window.addEventListener('resize', this._resizeHandler);
    // Internal layout changes (panel open/close on mobile) use a scoped event
    // to avoid triggering resize handlers on the parent site
    root.addEventListener('shc:layout-change', redrawMap);

    // Mobile filter panel
    qs('.mobile-filter-btn')?.addEventListener('click', () => this.toggleMobileFilter());
    qs('.mobile-filter-close')?.addEventListener('click', () => this.toggleMobileFilter());
    qs('.mobile-filter-backdrop')?.addEventListener('click', () => this.toggleMobileFilter());

    // Mobile fit-to-screen button
    qs('.fit-screen-btn')?.addEventListener('click', () => {
      TradeMap.zoomToRegion('Global');
    });

    // Mobile country backdrop closes any open country menu
    qs('.mobile-country-backdrop')?.addEventListener('click', () => {
      ['exp', 'imp'].forEach(p => {
        const menu = qs(`.${p}-menu`);
        const btn = qs(`.${p}-btn`);
        menu.classList.add('hidden');
        menu.classList.remove('mobile-menu-fixed');
        if (menu.parentElement !== btn.parentElement) {
          btn.parentElement.appendChild(menu);
        }
        btn.parentElement.classList.remove('picker-is-open');
      });
      qs('.mobile-country-backdrop').classList.add('hidden');
    });

    // Mobile year select syncs to desktop handler
    qs('.m-year-select')?.addEventListener('change', e => {
      const desktopSelect = qs('.year-select');
      desktopSelect.value = e.target.value;
      desktopSelect.dispatchEvent(new Event('change'));
    });

    // Sync initial active state to mobile panel buttons
    this.syncMobileFilterState();
  },

  setupHierarchicalDropdown(prefix, selector) {
    const root = getRoot();
    const btn = qs(`.${prefix}-btn`);
    const mBtn = qs(`.m-${prefix}-btn`);
    const menu = qs(`.${prefix}-menu`);
    const search = qs(`.${prefix}-search`);
    const clearAll = qs(`.${prefix}-clear-all`);

    const originalParent = btn.parentElement;

    const closeOtherMenu = () => {
      const otherPrefix = prefix === 'exp' ? 'imp' : 'exp';
      const otherMenu = qs(`.${otherPrefix}-menu`);
      const otherBtn = qs(`.${otherPrefix}-btn`);
      otherMenu.classList.add('hidden');
      otherMenu.classList.remove('mobile-menu-fixed');
      if (otherMenu.parentElement !== otherBtn.parentElement) {
        otherBtn.parentElement.appendChild(otherMenu);
      }
      otherBtn.parentElement.classList.remove('picker-is-open');
    };

    btn.addEventListener('click', e => {
      e.stopPropagation();
      closeOtherMenu();

      // Desktop layout: ensure menu is not in mobile fixed-position mode
      menu.classList.remove('mobile-menu-fixed');
      if (menu.parentElement !== originalParent) {
        originalParent.appendChild(menu);
      }
      menu.classList.toggle('hidden');

      originalParent.classList.toggle('picker-is-open', !menu.classList.contains('hidden'));
    });

    if (mBtn) {
      mBtn.addEventListener('click', e => {
        e.stopPropagation();
        closeOtherMenu();

        // Reparent the menu under the app root so its fixed positioning is not
        // clipped by any parent overflow/transform
        root.appendChild(menu);

        menu.classList.remove('hidden');
        menu.classList.add('mobile-menu-fixed');
        qs('.mobile-country-backdrop')?.classList.remove('hidden');
      });
    }

    root.addEventListener('click', e => {
      const isOutside = !menu.contains(e.target) && !btn.contains(e.target) && !mBtn?.contains(e.target);
      if (isOutside) {
        menu.classList.add('hidden');
        menu.classList.remove('mobile-menu-fixed');
        if (menu.parentElement !== originalParent) {
          originalParent.appendChild(menu);
        }
        originalParent.classList.remove('picker-is-open');
      }
    });

    search.addEventListener('input', e => {
      const term = e.target.value.toLowerCase().trim();
      if (!term) {
        // Reset to default: section/group rows visible, all children collapsed
        menu.classList.remove('is-searching');
        menu.querySelectorAll('.country-option').forEach(c => {
          c.classList.remove('search-hidden');
        });
        menu.querySelectorAll('.group-children').forEach(c => {
          c.classList.add('hidden');
        });
        menu.querySelectorAll('.group-toggle').forEach(t => {
          t.setAttribute('aria-expanded', 'false');
        });
      } else {
        // Search mode: CSS hides section/group rows and expands children; filter country items
        menu.classList.add('is-searching');
        menu.querySelectorAll('.group-children').forEach(c => {
          c.classList.remove('hidden');
        });
        menu.querySelectorAll('.country-option').forEach(item => {
          const text = item.innerText.toLowerCase();
          item.classList.toggle('search-hidden', !text.includes(term));
        });
      }
    });

    clearAll.addEventListener('click', () => {
      selector.clearAll();
    });
  },

  updateUIClasses(selector, activeEl) {
    for (let els = qsa(selector), i = 0; i < els.length; i++) els[i].classList.remove('active');
    activeEl.classList.add('active');
  },

  updateKPIBar() {
    const flows = STATE.filteredData || [];
    const stats = STATE.nodeStats || {};
    const rawStats = STATE.rawNodeStats || stats;
    const mf = METRIC_FORMAT[STATE.metric] || METRIC_FORMAT.value;

    const total = sum(flows, d => d.netValue);
    const totalEl = qs('.kpi-total');
    if (totalEl) totalEl.textContent = mf.fmt(total);

    const flowsEl = qs('.kpi-flows');
    if (flowsEl) flowsEl.textContent = format(',')(flows.length);

    const countriesEl = qs('.kpi-countries');
    if (countriesEl) countriesEl.textContent = Object.keys(stats).length;

    const topExpEl = qs('.kpi-top-exp');
    const topImpEl = qs('.kpi-top-imp');
    if (topExpEl || topImpEl) {
      // Single O(n) pass instead of O(n log n) sort — we only need the extremes.
      let topExp = null;
      let topImp = null;
      for (const [iso, st] of Object.entries(rawStats)) {
        if (!topExp || st.netBalance > topExp[1].netBalance) topExp = [iso, st];
        if (!topImp || st.netBalance < topImp[1].netBalance) topImp = [iso, st];
      }
      if (topExpEl) {
        if (topExp && topExp[1].netBalance > 0) {
          const name = STATE.countryNames[topExp[0]] || topExp[0];
          topExpEl.textContent = name.length > 16 ? `${name.slice(0, 15)}…` : name;
        } else {
          topExpEl.textContent = '—';
        }
      }
      if (topImpEl) {
        if (topImp && topImp[1].netBalance < 0) {
          const name = STATE.countryNames[topImp[0]] || topImp[0];
          topImpEl.textContent = name.length > 16 ? `${name.slice(0, 15)}…` : name;
        } else {
          topImpEl.textContent = '—';
        }
      }
    }

    const scopeEl = qs('.kpi-scope');
    if (scopeEl) scopeEl.textContent = this._buildScopeText();

    let nsTotal = 0;
    let ssTotal = 0;
    flows.forEach(d => {
      if (d.flowCategory === 'north-south') nsTotal += d.netValue;
      else if (d.flowCategory === 'south-south') ssTotal += d.netValue;
    });
    const nsPctEl = qs('.kpi-ns-pct');
    if (nsPctEl) nsPctEl.textContent = total > 0 ? `${Math.round((nsTotal / total) * 100)}%` : '—';
    const ssPctEl = qs('.kpi-ss-pct');
    if (ssPctEl) ssPctEl.textContent = total > 0 ? `${Math.round((ssTotal / total) * 100)}%` : '—';
  },

  _buildScopeText() {
    const region = STATE.region && STATE.region !== 'Global' ? STATE.region : null;
    const nExp = STATE.selectedExporters?.size || 0;
    const nImp = STATE.selectedImporters?.size || 0;
    if (!region && nExp === 0 && nImp === 0) return 'Global';
    const parts = [];
    if (region) {
      parts.push(region);
      if (nExp === 0 && nImp === 0) parts.push('Intra');
    }
    if (nExp > 0 && nImp > 0) parts.push(`${nExp} Exp · ${nImp} Imp`);
    else if (nExp > 0) parts.push(`${nExp} Exporters`);
    else if (nImp > 0) parts.push(`${nImp} Importers`);
    return parts.join(' · ');
  },

  // ── P1: Insight Side Panel ──────────────────────────────────────

  openInsightPanel(iso) {
    if (qs('.mobile-filter-panel')?.classList.contains('open')) {
      this.toggleMobileFilter();
    }
    const name = STATE.countryNames[iso] || iso;
    const stats = STATE.nodeStats[iso];
    const mf = METRIC_FORMAT[STATE.metric] || METRIC_FORMAT.value;
    const region = RegionConfig.getRegion(iso) || 'Unknown';
    const devStatus = CONFIG.development[iso] === 'north' ? 'Developed' : 'Developing';

    qs('.panel-country-name').textContent = name;
    qs('.panel-country-meta').textContent = `${region} · ${devStatus} · ${STATE.year}`;
    const panelBody = qs('.panel-body');
    panelBody.innerHTML = this._buildPanelContent(iso, stats, mf);
    this._wirePanelButtons(panelBody, iso);

    qs('.insight-panel').classList.add('open');
    getRoot().classList.add('insight-open');

    // Mobile layout: header hides and map area grows — notify the app only, not the parent site
    if (window.innerWidth <= 767) {
      setTimeout(() => getRoot().dispatchEvent(new CustomEvent('shc:layout-change')), 10);
    }

    this._currentPanelIso = iso;
    this.hideTooltip();

    // Reset Sea Route button to OFF for each new country
    const searouteBtn = qs('.searoute-btn');
    if (searouteBtn) {
      searouteBtn.disabled = false;
      searouteBtn.classList.remove('active');
    }

    if (TradeMap?.setFocus) {
      // Ensure routes.json is loaded before switching to sea-route rendering
      const doFocus = () => TradeMap.setFocus(iso);
      if (STATE._routesPromise) STATE._routesPromise.then(doFocus);
      else doFocus();
    }
  },

  // Delegate clicks on partner-list action buttons via event delegation
  // (one listener per panel; no per-button handlers or global window.App reference needed)
  _wirePanelButtons(panelBody, iso) {
    panelBody.addEventListener('click', e => {
      const btn = e.target.closest('.si-btn');
      if (!btn) return;
      const { action, partner } = btn.dataset;
      if (!partner) return;
      if (action === 'arc') {
        const arcExp = btn.dataset.arcExp || iso;
        const arcImp = btn.dataset.arcImp || partner;
        this.openArcModal(arcExp, arcImp);
      } else if (action === 'cmp') {
        this.openCompareModal(iso, partner);
      }
    });
  },

  closeInsightPanel() {
    qs('.insight-panel').classList.remove('open');
    getRoot().classList.remove('insight-open');

    const searouteBtn = qs('.searoute-btn');
    if (searouteBtn) {
      searouteBtn.disabled = true;
      searouteBtn.classList.remove('active');
    }

    // Mobile layout: header reappears and map area shrinks — notify the app only, not the parent site
    if (window.innerWidth <= 767) {
      setTimeout(() => getRoot().dispatchEvent(new CustomEvent('shc:layout-change')), 10);
    }

    this._currentPanelIso = null;
    if (TradeMap?.clearFocus) TradeMap.clearFocus();
  },

  // ── P2-A: Arc Detail Modal ──────────────────────────────────────

  async openArcModal(expIso, impIso) {
    if (!STATE.bilateralHistory) {
      await STATE._bilateralPromise;
    }
    const expName = STATE.countryNames[expIso] || expIso;
    const impName = STATE.countryNames[impIso] || impIso;
    const mf = METRIC_FORMAT[STATE.metric] || METRIC_FORMAT.value;

    qs('.arc-modal-title').textContent = `${expName}  →  ${impName}`;
    qs('.arc-modal-meta').textContent = `Net exporter: ${expName} · ${STATE.year}`;
    qs('.arc-modal-body').innerHTML = this._buildArcDetailContent(expIso, impIso, mf);

    qs('.arc-modal').classList.remove('hidden');
    this.hideTooltip();
  },

  closeArcModal() {
    qs('.arc-modal').classList.add('hidden');
  },

  _buildArcDetailContent(expIso, impIso, mf) {
    const expName = STATE.countryNames[expIso] || expIso;
    const impName = STATE.countryNames[impIso] || impIso;

    const yearData = {};
    for (let y = 2015; y <= 2024; y++) yearData[y] = { aToB: 0, bToA: 0 };

    // Resolve bilateral history from pre-computed JSON
    const [a, b] = [expIso, impIso].sort();
    const pairKey = `${a}|${b}`;
    const expIsA = expIso === a;
    const hist = STATE.bilateralHistory ? STATE.bilateralHistory[pairKey] : null;
    if (hist) {
      Object.entries(hist).forEach(([yStr, entry]) => {
        const y = +yStr;
        if (yearData[y]) {
          yearData[y].aToB = expIsA ? entry.aToB : entry.bToA;
          yearData[y].bToA = expIsA ? entry.bToA : entry.aToB;
        }
      });
    }

    const years = Object.keys(yearData).map(Number).sort();
    const nets = years.map(y => yearData[y].aToB - yearData[y].bToA);
    const atoBs = years.map(y => yearData[y].aToB);
    const bToAs = years.map(y => yearData[y].bToA);
    const maxAbs = Math.max(...atoBs, ...bToAs, 1);

    const cy = STATE.year;
    const curAtoB = yearData[cy] ? yearData[cy].aToB : 0;
    const curBtoA = yearData[cy] ? yearData[cy].bToA : 0;
    const curNet = curAtoB - curBtoA;
    const netClass = curNet >= 0 ? 'col-exp' : 'col-imp';
    const netSign = curNet >= 0 ? '+' : '';
    const fc = STATE.filteredData.find(d => (d.exporter === expIso && d.importer === impIso) || (d.exporter === impIso && d.importer === expIso));
    const flowCat = fc ? fc.flowCategory : null;
    const catBadge = flowCat ? `<span class="si-badge flow-badge ${FC[flowCat]}">${CAT_LABELS_ARROW[flowCat]}</span>` : '';

    let html = `
      <div class="si-kpi-grid cols-3">
        <div class="si-kpi-card exp">
          <div class="si-kpi-label">${expName} →</div>
          <div class="si-kpi-value">${mf.fmt(curAtoB)}</div>
        </div>
        <div class="si-kpi-card net">
          <div class="si-kpi-label">Net (${cy})</div>
          <div class="si-kpi-value ${netClass}">${netSign}${mf.fmt(Math.abs(curNet))}</div>
        </div>
        <div class="si-kpi-card imp">
          <div class="si-kpi-label">← ${impName}</div>
          <div class="si-kpi-value">${mf.fmt(curBtoA)}</div>
        </div>
      </div>
    ${catBadge ? `<div class="si-badge-wrap">${catBadge}</div>` : ''}`;

    const W = 440;
    const H = 36;
    const barH = 14;
    const gap = 3;
    const bw = (W - gap * (years.length - 1)) / years.length;
    const bars = years
      .map((y, i) => {
        const aH = Math.max(0, (atoBs[i] / maxAbs) * barH);
        const bH = Math.max(0, (bToAs[i] / maxAbs) * barH);
        const x = i * (bw + gap);
        const isCur = y === cy;
        const yr = String(y).slice(2);
        return `
          <rect class="chart-bar-exp${isCur ? ' cur' : ''}" x="${x}" y="${H / 2 - aH}" width="${bw}" height="${aH}" rx="1"/>
          <rect class="chart-bar-imp${isCur ? ' cur' : ''}" x="${x}" y="${H / 2}" width="${bw}" height="${bH}" rx="1"/>
          ${isCur ? `<rect class="chart-cur-box" x="${x - 0.5}" y="2" width="${bw + 1}" height="${H - 4}" rx="2" stroke-width="1"/>` : ''}
          <text class="chart-label${isCur ? ' cur' : ''}" x="${x + bw / 2}" y="${H + 11}" text-anchor="middle">${yr}</text>`;
      })
      .join('');

    html += `
      <div class="si-section">
        <div class="si-label">Bilateral Trade History</div>
        <div class="si-chart-legend">
          <div class="si-legend-item"><div class="si-legend-swatch swatch-exp"></div><span>${expName} exports</span></div>
          <div class="si-legend-item"><div class="si-legend-swatch swatch-imp"></div><span>${impName} exports</span></div>
        </div>
        <svg class="svg-full" width="${W}" height="${H + 14}">
          <line class="chart-midline" x1="0" y1="${H / 2}" x2="${W}" y2="${H / 2}"/>
          ${bars}
        </svg>
      </div>`;

    const tableRows = years
      .filter(y => atoBs[years.indexOf(y)] > 0 || bToAs[years.indexOf(y)] > 0)
      .map(y => {
        const idx = years.indexOf(y);
        const net = nets[idx];
        const nClass = net >= 0 ? 'col-exp' : 'col-imp';
        const isCur = y === cy;
        return `
          <tr${isCur ? ' class="row-cur"' : ''}>
            <td class="al${isCur ? ' cur' : ' muted'}">${y}</td>
            <td class="ar col-exp-text">${mf.fmt(atoBs[idx])}</td>
            <td class="ar col-imp">${mf.fmt(bToAs[idx])}</td>
            <td class="ar bold ${nClass}">${net >= 0 ? '+' : ''}${mf.fmt(Math.abs(net))}</td>
          </tr>`;
      })
      .join('');

    html += `
      <div class="si-section">
        <div class="si-label">Year-by-Year Table</div>
        <table class="si-table">
          <thead>
            <tr>
              <th class="al">Year</th>
              <th class="ar col-exp-text">${expName} →</th>
              <th class="ar col-imp">← ${impName}</th>
              <th class="ar">Net</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>`;

    return html;
  },

  // ── P2-B: Compare Modal ─────────────────────────────────────────

  openCompareModal(isoA, isoB) {
    const nameA = STATE.countryNames[isoA] || isoA;
    const nameB = STATE.countryNames[isoB] || isoB;
    const mf = METRIC_FORMAT[STATE.metric] || METRIC_FORMAT.value;

    qs('.compare-modal-title').textContent = `${nameA}  vs  ${nameB}`;
    qs('.compare-modal-body').innerHTML = this._buildCompareContent(isoA, isoB, mf);
    qs('.compare-modal').classList.remove('hidden');
    this.hideTooltip();
  },

  closeCompareModal() {
    qs('.compare-modal').classList.add('hidden');
    this._compareIso = null;
  },

  openMethodologyModal() {
    qs('.methodology-modal').classList.remove('hidden');
  },

  closeMethodologyModal() {
    qs('.methodology-modal').classList.add('hidden');
  },

  _buildCompareContent(isoA, isoB, mf) {
    const nameA = STATE.countryNames[isoA] || isoA;
    const nameB = STATE.countryNames[isoB] || isoB;
    const statsA = STATE.nodeStats[isoA];
    const statsB = STATE.nodeStats[isoB];

    const devA = CONFIG.development[isoA] === 'north' ? 'Developed' : 'Developing';
    const devB = CONFIG.development[isoB] === 'north' ? 'Developed' : 'Developing';
    const regA = RegionConfig.getRegion(isoA) || '—';
    const regB = RegionConfig.getRegion(isoB) || '—';

    const getYearlyTotals = iso => {
      const isoData = STATE.trendSummary[iso] || {};
      const t = {};
      for (let y = 2015; y <= 2024; y++) t[y] = isoData[String(y)] || 0;
      return t;
    };
    const totA = getYearlyTotals(isoA);
    const totB = getYearlyTotals(isoB);
    const years = Object.keys(totA).map(Number).sort();
    const maxV = Math.max(...years.map(y => Math.max(totA[y], totB[y])), 1);

    const metricRows = [
      { label: 'Region', vA: regA, vB: regB },
      { label: 'Status', vA: devA, vB: devB },
      { label: 'Gross Volume', vA: statsA ? mf.fmt(statsA.grossVolume) : '—', vB: statsB ? mf.fmt(statsB.grossVolume) : '—', winA: statsA && statsB ? statsA.grossVolume > statsB.grossVolume : null },
      { label: 'Net Balance', vA: statsA ? mf.fmt(Math.abs(statsA.netBalance)) : '—', vB: statsB ? mf.fmt(Math.abs(statsB.netBalance)) : '—' },
      { label: 'Role', vA: statsA ? (statsA.netBalance >= 0 ? 'Net Exporter' : 'Net Importer') : '—', vB: statsB ? (statsB.netBalance >= 0 ? 'Net Exporter' : 'Net Importer') : '—' }
    ];

    const headerRows = metricRows
      .map(r => {
        const hlAClass = r.winA === true ? 'col-positive' : r.winA === false ? 'col-negative' : '';
        const hlBClass = r.winA === false ? 'col-positive' : r.winA === true ? 'col-negative' : '';
        return `
          <tr>
            <td class="ar ${hlAClass}">${r.vA}</td>
            <td class="ac muted bold compare-label">${r.label}</td>
            <td class="${hlBClass}">${r.vB}</td>
          </tr>`;
      })
      .join('');

    let html = `
      <div class="si-kpi-grid cols-3 has-margin">
        <div class="si-kpi-card exp si-kpi-card-compare-a">
          <div class="si-kpi-value si-kpi-value-small">${nameA}</div>
        </div>
        <div class="si-kpi-card net si-kpi-card-compare-mid">
          <span class="si-kpi-card-compare-vs">vs</span>
        </div>
        <div class="si-kpi-card si-kpi-card-compare-b">
          <div class="si-kpi-value si-kpi-value-small col-amber">${nameB}</div>
        </div>
      </div>
      <table class="si-table has-margin">${headerRows}</table>`;

    const W = 580;
    const H = 60;
    const gap = 4;
    const bw = (W - gap * (years.length - 1)) / years.length;
    const points = arr =>
      years
        .map((y, i) => {
          const x = i * (bw + gap) + bw / 2;
          const yp = H - (arr[y] / maxV) * H;
          return `${x},${yp}`;
        })
        .join(' ');

    const dotsA = years
      .map((y, i) => {
        const x = i * (bw + gap) + bw / 2;
        const yp = H - (totA[y] / maxV) * H;
        const isCur = y === STATE.year;
        return `<circle class="chart-dot-exp${isCur ? ' cur' : ''}" cx="${x}" cy="${yp}" r="${isCur ? 4 : 2}"/>`;
      })
      .join('');
    const dotsB = years
      .map((y, i) => {
        const x = i * (bw + gap) + bw / 2;
        const yp = H - (totB[y] / maxV) * H;
        const isCur = y === STATE.year;
        return `<circle class="chart-dot-compare${isCur ? ' cur' : ''}" cx="${x}" cy="${yp}" r="${isCur ? 4 : 2}"/>`;
      })
      .join('');
    const xLabels = years
      .filter((_, i) => i % 2 === 0)
      .map(y => {
        const idx = years.indexOf(y);
        const x = idx * (bw + gap) + bw / 2;
        return `<text class="axis-label" x="${x}" y="${H + 12}" text-anchor="middle">${String(y).slice(2)}</text>`;
      })
      .join('');

    html += `
      <div class="si-section">
        <div class="si-label">Trade Volume Trend</div>
        <div class="si-chart-legend">
          <div class="si-legend-item"><div class="si-legend-swatch swatch-exp"></div><span>${nameA}</span></div>
          <div class="si-legend-item"><div class="si-legend-swatch swatch-yellow"></div><span>${nameB}</span></div>
        </div>
        <svg class="svg-full" width="${W}" height="${H + 16}">
          <polyline class="chart-line-exp" points="${points(totA)}"/>
          <polyline class="chart-line-compare" points="${points(totB)}"/>
          ${dotsA}${dotsB}${xLabels}
        </svg>
      </div>`;

    const tableRows = years
      .filter(y => totA[y] > 0 || totB[y] > 0)
      .reverse()
      .map(y => {
        const isCur = y === STATE.year;
        const winA = totA[y] > totB[y];
        return `
          <tr${isCur ? ' class="row-cur"' : ''}>
            <td class="ar ${winA ? 'col-positive' : 'col-muted'}">${mf.fmt(totA[y])}</td>
            <td class="ac${isCur ? ' cur' : ' muted'}">${y}</td>
            <td class="${!winA ? 'col-positive' : 'col-muted'}">${mf.fmt(totB[y])}</td>
          </tr>`;
      })
      .join('');

    html += `
      <div class="si-section">
        <div class="si-label">Year-by-Year Comparison</div>
        <table class="si-table">
          <thead>
            <tr>
              <th class="ar col-exp-text">${nameA}</th>
              <th class="ac">Year</th>
              <th class="col-amber-dark">${nameB}</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>`;

    return html;
  },

  _buildPanelContent(iso, stats, mf) {
    const partnerExports = {};
    const partnerImports = {};
    STATE.filteredData.forEach(d => {
      if (d.exporter === iso) partnerExports[d.importer] = (partnerExports[d.importer] || 0) + d.netValue;
      else if (d.importer === iso) partnerImports[d.exporter] = (partnerImports[d.exporter] || 0) + d.netValue;
    });

    const yearlyTotals = {};
    const isoTrend = STATE.trendSummary[iso] || {};
    for (let y = 2015; y <= 2024; y++) yearlyTotals[y] = isoTrend[String(y)] || 0;

    let html = '';

    html += `
      <div class="si-narrative-box">
        <div class="si-narrative-title">Auto Insights</div>
        ${this._generateNarrative(iso, stats, partnerExports, partnerImports, yearlyTotals, mf)}
      </div>`;

    if (!stats) return html;

    const isExp = stats.netBalance >= 0;
    html += `
      <div class="si-section">
        <div class="si-label">Key Metrics (${STATE.year})</div>
        <div class="si-kpi-grid cols-2">
          <div class="si-kpi-card net">
            <div class="si-kpi-label">${mf.grossLabel.replace(':', '')}</div>
            <div class="si-kpi-value">${mf.fmt(stats.grossVolume)}</div>
          </div>
          <div class="si-kpi-card ${isExp ? 'exp' : 'imp'}">
            <div class="si-kpi-label">${mf.netLabel.replace(':', '')}</div>
            <div class="si-kpi-value ${isExp ? 'col-exp' : 'col-imp'}">${isExp ? '+' : ''}${mf.fmt(Math.abs(stats.netBalance))}</div>
          </div>
        </div>
        <div class="si-role-wrap">
          <span class="si-role-badge ${isExp ? 'exp' : 'imp'}">${isExp ? 'Net Exporter' : 'Net Importer'}</span>
        </div>
      </div>`;

    html += this._buildConcentrationGauge(iso, mf);

    const allPartners = {};
    Object.entries(partnerExports).forEach(([p, v]) => {
      allPartners[p] = (allPartners[p] || 0) + v;
    });
    Object.entries(partnerImports).forEach(([p, v]) => {
      allPartners[p] = (allPartners[p] || 0) + v;
    });
    const sortedPartners = Object.entries(allPartners)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (sortedPartners.length > 0) {
      const maxPVal = sortedPartners[0][1];

      // Build bilateral totals from yearCache (pre-threshold) once for rank lookups.
      const bilatRaw = STATE.yearCache[STATE.year] || [];
      const bilatTotals = {};
      bilatRaw.forEach(d => {
        if (!bilatTotals[d.exporter]) bilatTotals[d.exporter] = {};
        bilatTotals[d.exporter][d.importer] = (bilatTotals[d.exporter][d.importer] || 0) + d.netValue;
        if (!bilatTotals[d.importer]) bilatTotals[d.importer] = {};
        bilatTotals[d.importer][d.exporter] = (bilatTotals[d.importer][d.exporter] || 0) + d.netValue;
      });
      // Returns 1-based rank of targetIso in forIso's partner list; 0 if not found.
      const getPartnerRank = (targetIso, forIso) => {
        const map = bilatTotals[forIso];
        if (!map || !(targetIso in map)) return 0;
        const targetVal = map[targetIso];
        let rank = 1;
        for (const k in map) {
          if (k !== targetIso && map[k] > targetVal) rank++;
        }
        return rank;
      };

      const rows = sortedPartners
        .map(([pIso, val], idx) => {
          const pName = STATE.countryNames[pIso] || pIso;
          const isoName = STATE.countryNames[iso] || iso;
          const barPct = Math.round((val / maxPVal) * 100);
          const isExportTo = !!partnerExports[pIso];
          const arrow = isExportTo ? '→' : '←';
          const aColorClass = isExportTo ? 'col-exp' : 'col-imp';
          const bgColorClass = isExportTo ? 'bg-exp' : 'bg-imp';
          const arcExpIso = isExportTo ? iso : pIso;
          const arcImpIso = isExportTo ? pIso : iso;

          // Rank asymmetry: where does iso rank in pIso's own partner list? (pre-threshold)
          const theirRank = getPartnerRank(iso, pIso);
          const rankTier = theirRank <= 3 ? 'high' : theirRank <= 10 ? 'mid' : 'low';
          const rankTip = theirRank > 0 ? `${pName} ranks ${isoName} as their #${theirRank} trading partner (pre-threshold)` : '';
          const rankDisplay = theirRank > 0 ? `<span class="rank-display"><span class="rank-pos">${idx + 1}·</span><span class="rank-partner" data-tier="${rankTier}" title="${rankTip}">#${theirRank}</span></span>` : `<span class="rank-muted">${idx + 1}</span>`;

          // Bilateral flow split: share flowing in the dominant direction (pre-threshold gross flows)
          let splitBadge = '';
          if (STATE.bilateralHistory) {
            const [a, b] = [iso, pIso].sort();
            const hist = STATE.bilateralHistory[`${a}|${b}`];
            const entry = hist ? hist[String(STATE.year)] : null;
            if (entry) {
              const isoIsA = iso === a;
              const isoOut = isoIsA ? entry.aToB : entry.bToA;
              const isoIn = isoIsA ? entry.bToA : entry.aToB;
              const tot = isoOut + isoIn;
              if (tot > 0) {
                const domPct = Math.round((Math.max(isoOut, isoIn) / tot) * 100);
                const expDom = isoOut >= isoIn;
                const splitCls = domPct >= 75 ? (expDom ? 'split-exp' : 'split-imp') : '';
                const tip = expDom ? `${domPct}% of gross bilateral trade flows from ${isoName}` : `${domPct}% of gross bilateral trade flows from ${pName}`;
                splitBadge = `<span class="split-badge ${splitCls}" title="${tip}">${expDom ? '→' : '←'}${domPct}%</span>`;
              }
            }
          }

          return `
            <div class="si-partner-row">
              <span class="si-rank">${rankDisplay}</span>
              <span class="si-arrow ${aColorClass}">${arrow}</span>
              <span class="si-name">${pName}</span>
              <div class="si-bar-wrap"><div class="si-bar-fill ${bgColorClass}" style="--pct: ${barPct}%"></div></div>
              <span class="si-split">${splitBadge}</span>
              <span class="si-val">${mf.fmt(val)}</span>
              <div class="si-actions">
                <button type="button" class="si-btn" data-action="arc" data-partner="${pIso}" data-arc-exp="${arcExpIso}" data-arc-imp="${arcImpIso}" title="Bilateral history">↗</button>
                <button type="button" class="si-btn cmp" data-action="cmp" data-partner="${pIso}" title="Compare">⇄</button>
              </div>
            </div>`;
        })
        .join('');
      html += `
        <div class="si-section">
          <div class="si-partners-hdr">
            <div class="si-label si-label-flush">Trading Partners</div>
            <span class="si-partners-hint">rank you · them · split</span>
          </div>
          <div class="si-partners">${rows}</div>
        </div>`;
    }

    html += this._buildButterflyChart(iso);

    html += this._buildPolarFingerprint(iso);

    const years = Object.keys(yearlyTotals).map(Number).sort();
    const yVals = years.map(y => yearlyTotals[y]);
    const maxYV = Math.max(...yVals);
    if (maxYV > 0) {
      const W = 284;
      const H = 48;
      const gap = 2;
      const barW = (W - gap * (years.length - 1)) / years.length;
      const bars = yVals
        .map((v, i) => {
          const h = Math.max(2, (v / maxYV) * H);
          const x = i * (barW + gap);
          const isCur = years[i] === STATE.year;
          const yLabel = String(years[i]).slice(2);
          return `<rect class="trend-bar${isCur ? ' cur' : ''}" x="${x}" y="${H - h}" width="${barW}" height="${h}" rx="2"/><text class="trend-label${isCur ? ' cur' : ''}" x="${x + barW / 2}" y="${H + 11}" text-anchor="middle">${yLabel}</text>`;
        })
        .join('');
      html += `
        <div class="si-section">
          <div class="si-label">Trade Trend (2015–${STATE.year})</div>
          <svg class="svg-full" width="${W}" height="${H + 14}">${bars}</svg>
        </div>`;
    }

    const catTotals = {};
    let countryTotal = 0;
    (STATE.yearCache[STATE.year] || []).forEach(d => {
      if (d.exporter === iso || d.importer === iso) {
        catTotals[d.flowCategory] = (catTotals[d.flowCategory] || 0) + d.netValue;
        countryTotal += d.netValue;
      }
    });
    if (countryTotal > 0) {
      const segments = Object.entries(catTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, val]) => ({ cat, pct: (val / countryTotal) * 100 }));
      const barSegs = segments.map(s => `<div class="si-flow-seg ${FC[s.cat]}" style="--pct: ${s.pct}%"></div>`).join('');
      const compRows = segments
        .map(
          s => `
            <div class="si-comp-row ${FC[s.cat]}">
              <div class="si-comp-dot"></div>
              <span class="si-comp-label">${CAT_LABELS_FULL[s.cat]}</span>
              <span class="si-comp-pct">${Math.round(s.pct)}%</span>
            </div>`
        )
        .join('');
      html += `
        <div class="si-section">
          <div class="si-label">Flow Composition</div>
          <div class="si-flow-bar">${barSegs}</div>
          <div class="si-comp-rows">${compRows}</div>
        </div>`;
    }

    return html;
  },

  // HHI computed from pre-threshold raw data to avoid zoom-level distortion.
  _buildConcentrationGauge(iso, _mf) {
    const rawFlows = STATE.yearCache[STATE.year] || [];
    const isRegional = STATE.region && STATE.region !== 'Global';
    const combined = {};
    rawFlows.forEach(d => {
      if (!isRegional || (RegionConfig.getRegion(d.exporter) === STATE.region && RegionConfig.getRegion(d.importer) === STATE.region)) {
        if (d.exporter === iso) combined[d.importer] = (combined[d.importer] || 0) + d.netValue;
        else if (d.importer === iso) combined[d.exporter] = (combined[d.exporter] || 0) + d.netValue;
      }
    });
    const total = Object.values(combined).reduce((s, v) => s + v, 0);
    if (total === 0) return '';
    const scopeNote = isRegional ? `${STATE.region} intra-regional · pre-threshold` : 'All net bilateral flows · pre-threshold';

    const shares = Object.values(combined).map(v => v / total);
    const hhi = shares.reduce((s, sh) => s + sh * sh, 0);

    const sorted = Object.entries(combined).sort((a, b) => b[1] - a[1]);
    const top1Pct = sorted[0] ? (sorted[0][1] / total) * 100 : 0;
    const top3Pct = (sorted.slice(0, 3).reduce((s, e) => s + e[1], 0) / total) * 100;
    const top5Pct = (sorted.slice(0, 5).reduce((s, e) => s + e[1], 0) / total) * 100;
    const top1Name = sorted[0] ? STATE.countryNames[sorted[0][0]] || sorted[0][0] : '—';

    // Thresholds calibrated for trade (not market-competition DOJ levels).
    let label;
    let hhiTier;
    if (hhi < 0.2) {
      label = 'Diversified';
      hhiTier = 'low';
    } else if (hhi < 0.4) {
      label = 'Moderate';
      hhiTier = 'mid';
    } else {
      label = 'Highly concentrated';
      hhiTier = 'high';
    }

    const W = 240;
    const H = 110;
    const cx = W / 2;
    const cy = H - 12;
    const r = 84;
    const startA = Math.PI;
    const endA = 2 * Math.PI;
    const valA = startA + (endA - startA) * Math.min(hhi, 1);

    const arcPath = (a1, a2) => {
      const x1 = cx + r * Math.cos(a1);
      const y1 = cy + r * Math.sin(a1);
      const x2 = cx + r * Math.cos(a2);
      const y2 = cy + r * Math.sin(a2);
      return `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${a2 - a1 > Math.PI ? 1 : 0},1 ${x2.toFixed(2)},${y2.toFixed(2)}`;
    };
    const tick = v => {
      const a = startA + (endA - startA) * v;
      const x1 = cx + (r + 3) * Math.cos(a);
      const y1 = cy + (r + 3) * Math.sin(a);
      const x2 = cx + (r - 7) * Math.cos(a);
      const y2 = cy + (r - 7) * Math.sin(a);
      return `<line class="gauge-tick" x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"/>`;
    };
    const mx1 = cx + (r - 14) * Math.cos(valA);
    const my1 = cy + (r - 14) * Math.sin(valA);
    const mx2 = cx + (r + 6) * Math.cos(valA);
    const my2 = cy + (r + 6) * Math.sin(valA);

    return `
      <div class="si-section">
        <div class="si-label">Partner Concentration (HHI)</div>
        <div class="si-sublabel">${scopeNote}</div>
        <div class="si-card" data-hhi="${hhiTier}">
          <svg class="svg-gauge" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
            <path class="hhi-arc-bg" d="${arcPath(startA, endA)}"/>
            <path class="hhi-arc-filled" d="${arcPath(startA, valA)}"/>
            ${tick(0.2)}${tick(0.4)}
            <line class="gauge-needle" x1="${mx1.toFixed(2)}" y1="${my1.toFixed(2)}" x2="${mx2.toFixed(2)}" y2="${my2.toFixed(2)}"/>
            <text class="gauge-score" x="${cx}" y="${cy - 36}" text-anchor="middle">${(hhi * 10000).toFixed(0)}</text>
            <text class="gauge-sublabel" x="${cx}" y="${cy - 20}" text-anchor="middle">HHI score (0–10000)</text>
          </svg>
          <div class="si-badge-wrap">
            <span class="si-badge hhi-badge">${label}</span>
          </div>
          <div class="si-hhi-stats">
            <div><div class="hhi-l">Top 1</div><div class="hhi-v">${top1Pct.toFixed(0)}%</div><div class="hhi-s" title="${top1Name}">${top1Name}</div></div>
            <div><div class="hhi-l">Top 3</div><div class="hhi-v">${top3Pct.toFixed(0)}%</div><div class="hhi-s">share</div></div>
            <div><div class="hhi-l">Top 5</div><div class="hhi-v">${top5Pct.toFixed(0)}%</div><div class="hhi-s">share</div></div>
          </div>
        </div>
      </div>`;
  },

  // Polar Fingerprint: geographic bearing computed via great-circle formula.
  // Uses pre-threshold raw data so small-country partners are included.
  _buildPolarFingerprint(iso) {
    const myCoords = STATE.countryCoords[iso];
    if (!myCoords) return '';
    const [lon1, lat1] = myCoords;

    const bearingTo = (lon2, lat2) => {
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;
      const y = Math.sin(Δλ) * Math.cos(φ2);
      const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
      return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
    };

    const SECTORS = 8;
    const SECTOR_WIDTH = 45;
    const sectorExp = new Array(SECTORS).fill(0);
    const sectorImp = new Array(SECTORS).fill(0);
    let anyData = false;

    const rawFlows = STATE.yearCache[STATE.year] || [];
    const isRegional = STATE.region && STATE.region !== 'Global';
    rawFlows.forEach(d => {
      if (!isRegional || (RegionConfig.getRegion(d.exporter) === STATE.region && RegionConfig.getRegion(d.importer) === STATE.region)) {
        const isExport = d.exporter === iso;
        const isImport = d.importer === iso;
        if (!isExport && !isImport) return;
        const partnerIso = isExport ? d.importer : d.exporter;
        const c = STATE.countryCoords[partnerIso];
        if (!c) return;
        const idx = Math.floor((bearingTo(c[0], c[1]) + SECTOR_WIDTH / 2) / SECTOR_WIDTH) % SECTORS;
        if (isExport) sectorExp[idx] += d.netValue;
        else sectorImp[idx] += d.netValue;
        anyData = true;
      }
    });
    if (!anyData) return '';

    const maxVal = Math.max(...sectorExp, ...sectorImp, 1);
    const W = 220;
    const H = 220;
    const cx = W / 2;
    const cy = H / 2;
    const innerR = 16;
    const maxBarLen = 78;
    const labels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const parts = [];

    [0.25, 0.5, 1].forEach(p => {
      const rr = innerR + maxBarLen * p;
      parts.push(`<circle class="polar-grid-ring${p < 1 ? ' dashed' : ''}" cx="${cx}" cy="${cy}" r="${rr}"/>`);
    });
    parts.push(`<line class="polar-grid-axis" x1="${cx}" y1="${cy - innerR - maxBarLen}" x2="${cx}" y2="${cy + innerR + maxBarLen}"/>`);
    parts.push(`<line class="polar-grid-axis" x1="${cx - innerR - maxBarLen}" y1="${cy}" x2="${cx + innerR + maxBarLen}" y2="${cy}"/>`);

    for (let i = 0; i < SECTORS; i++) {
      const centerRad = ((i * SECTOR_WIDTH - 90) * Math.PI) / 180;
      const offsetRad = (9 * Math.PI) / 180;
      const expLen = (sectorExp[i] / maxVal) * maxBarLen;
      const impLen = (sectorImp[i] / maxVal) * maxBarLen;
      const drawBar = (len, angleRad, cls) => {
        if (len < 0.5) return;
        const x1 = cx + innerR * Math.cos(angleRad);
        const y1 = cy + innerR * Math.sin(angleRad);
        const x2 = cx + (innerR + len) * Math.cos(angleRad);
        const y2 = cy + (innerR + len) * Math.sin(angleRad);
        parts.push(`<line class="${cls}" x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"/>`);
      };
      drawBar(expLen, centerRad + offsetRad, 'polar-exp');
      drawBar(impLen, centerRad - offsetRad, 'polar-imp');

      const labelR = innerR + maxBarLen + 14;
      parts.push(`<text class="polar-label" x="${(cx + labelR * Math.cos(centerRad)).toFixed(2)}" y="${(cy + labelR * Math.sin(centerRad) + 3).toFixed(2)}" text-anchor="middle">${labels[i]}</text>`);
    }
    parts.push(`<circle class="polar-center" cx="${cx}" cy="${cy}" r="3.2"/>`);

    const scopeNote = isRegional ? `${STATE.region} intra-regional · pre-threshold` : 'All net bilateral flows · pre-threshold';
    return `
      <div class="si-section">
        <div class="si-label">Trade Fingerprint</div>
        <div class="si-sublabel">${scopeNote}</div>
        <div class="si-card si-card-center">
          <svg class="svg-polar" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
            ${parts.join('')}
          </svg>
          <div class="si-chart-footer">
            <div class="si-legend-item"><div class="si-legend-swatch swatch-exp"></div><span>Exports</span></div>
            <div class="si-legend-item"><div class="si-legend-swatch swatch-imp"></div><span>Imports</span></div>
          </div>
          <div class="si-chart-caption">Bar direction = geographic bearing from this country</div>
        </div>
      </div>`;
  },

  // Butterfly chart: for each of the top 7 partners, show export bar (right, blue)
  // and import bar (left, red). Lengths are scaled to the maximum single-direction value.
  // Source: bilateralHistory (gross flows, both directions). Falls back to yearCache net direction.
  _buildButterflyChart(iso) {
    const rawFlows = STATE.yearCache[STATE.year] || [];
    const isRegional = STATE.region && STATE.region !== 'Global';
    const combined = {};
    rawFlows.forEach(d => {
      if (isRegional && !(RegionConfig.getRegion(d.exporter) === STATE.region && RegionConfig.getRegion(d.importer) === STATE.region)) return;
      if (d.exporter === iso) combined[d.importer] = (combined[d.importer] || 0) + d.netValue;
      else if (d.importer === iso) combined[d.exporter] = (combined[d.exporter] || 0) + d.netValue;
    });

    const topPartners = Object.entries(combined)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([p]) => p);

    if (topPartners.length === 0) return '';

    const partnerData = topPartners.map(pIso => {
      let expVal = 0;
      let impVal = 0;
      if (STATE.bilateralHistory) {
        const [a, b] = [iso, pIso].sort();
        const hist = STATE.bilateralHistory[`${a}|${b}`];
        const entry = hist ? hist[String(STATE.year)] : null;
        if (entry) {
          const isoIsA = iso === a;
          expVal = isoIsA ? entry.aToB || 0 : entry.bToA || 0;
          impVal = isoIsA ? entry.bToA || 0 : entry.aToB || 0;
        } else {
          // Fallback: place net value on the dominant side
          const flow = rawFlows.find(d => (d.exporter === iso && d.importer === pIso) || (d.exporter === pIso && d.importer === iso));
          if (flow) {
            if (flow.exporter === iso) expVal = flow.netValue;
            else impVal = flow.netValue;
          }
        }
      } else {
        const flow = rawFlows.find(d => (d.exporter === iso && d.importer === pIso) || (d.exporter === pIso && d.importer === iso));
        if (flow) {
          if (flow.exporter === iso) expVal = flow.netValue;
          else impVal = flow.netValue;
        }
      }
      return { pIso, expVal, impVal };
    });

    const maxVal = Math.max(...partnerData.map(d => Math.max(d.expVal, d.impVal)), 1);

    // Layout: name zone in center, bars diverge left (imports) and right (exports)
    const W = 280;
    const nameW = 72;
    const cx = W / 2;
    const leftEdge = cx - nameW / 2;
    const rightEdge = cx + nameW / 2;
    const barMaxLen = 92;
    const barH = 9;
    const rowGap = 16;

    const rows = partnerData
      .map((d, i) => {
        const y = i * rowGap;
        const expLen = d.expVal > 0 ? Math.max(1.5, (d.expVal / maxVal) * barMaxLen) : 0;
        const impLen = d.impVal > 0 ? Math.max(1.5, (d.impVal / maxVal) * barMaxLen) : 0;
        const name = STATE.countryNames[d.pIso] || d.pIso;
        const shortName = name.length > 12 ? `${name.slice(0, 11)}…` : name;

        const impBar = impLen > 0 ? `<rect class="butterfly-imp" x="${(leftEdge - impLen).toFixed(1)}" y="${y}" width="${impLen.toFixed(1)}" height="${barH}" rx="2"/>` : '';
        const expBar = expLen > 0 ? `<rect class="butterfly-exp" x="${rightEdge}" y="${y}" width="${expLen.toFixed(1)}" height="${barH}" rx="2"/>` : '';
        const nameEl = `<text class="butterfly-label" x="${cx}" y="${y + barH - 1}" text-anchor="middle">${shortName}</text>`;

        return `${impBar}${expBar}${nameEl}`;
      })
      .join('');

    const totalH = topPartners.length * rowGap + barH;

    const grid = `
      <text class="butterfly-axis-imp" x="${(leftEdge - barMaxLen / 2).toFixed(0)}" y="-4" text-anchor="middle">← Imports</text>
      <text class="butterfly-axis-exp" x="${(rightEdge + barMaxLen / 2).toFixed(0)}" y="-4" text-anchor="middle">Exports →</text>
      <line class="butterfly-grid-line" x1="${leftEdge}" y1="0" x2="${leftEdge}" y2="${totalH}"/>
      <line class="butterfly-grid-line" x1="${rightEdge}" y1="0" x2="${rightEdge}" y2="${totalH}"/>`;

    const scopeNote = isRegional ? `${STATE.region} · top 7 · pre-threshold` : 'Top 7 partners · gross bilateral · pre-threshold';

    return `
      <div class="si-section">
        <div class="si-label">Bilateral Trade Split</div>
        <div class="si-sublabel">${scopeNote}</div>
        <div class="si-card">
          <svg class="svg-full" viewBox="0 -10 ${W} ${totalH + 12}" preserveAspectRatio="xMidYMid meet">
            ${grid}
            ${rows}
          </svg>
        </div>
      </div>`;
  },

  _generateNarrative(iso, stats, partnerExports, partnerImports, yearlyTotals, mf) {
    const name = STATE.countryNames[iso] || iso;
    const sentences = [];

    if (stats) {
      const isExp = stats.netBalance >= 0;
      const role = isExp ? 'net exporter' : 'net importer';

      const _yearStr = String(STATE.year);
      if (!this._globalRankCache[_yearStr]) {
        const globalVols = {};
        Object.entries(STATE.trendSummary).forEach(([isoKey, yearData]) => {
          const val = yearData[_yearStr];
          if (val > 0) globalVols[isoKey] = val;
        });
        this._globalRankCache[_yearStr] = Object.entries(globalVols).sort((a, b) => b[1] - a[1]);
      }
      const sortedGlobal = this._globalRankCache[_yearStr];
      const globalRank = sortedGlobal.findIndex(([k]) => k === iso) + 1;
      const totalCountries = sortedGlobal.length;
      const rankStr = globalRank > 0 ? `ranked <strong>#${globalRank} of ${totalCountries}</strong> globally` : 'active';
      sentences.push(`<strong>${name}</strong> is a <strong>${role}</strong> of used clothing, ${rankStr} by gross trade volume in ${STATE.year} (${mf.fmt(stats.grossVolume)}).`);
    }

    const years = Object.keys(yearlyTotals).map(Number).sort();
    const curIdx = years.indexOf(STATE.year);
    if (curIdx > 0) {
      const curVal = yearlyTotals[STATE.year];
      const prevVal = yearlyTotals[years[curIdx - 1]];
      if (prevVal > 0 && curVal > 0) {
        const yoy = ((curVal - prevVal) / prevVal) * 100;
        const dir = yoy >= 0 ? 'grew' : 'declined';
        const yoyClass = yoy >= 0 ? 'col-positive' : 'col-negative';
        const firstNZ = years.findIndex(y => yearlyTotals[y] > 0);
        let cagrStr = '';
        if (firstNZ >= 0 && curIdx > firstNZ && yearlyTotals[years[firstNZ]] > 0) {
          const n = curIdx - firstNZ;
          const cagr = ((curVal / yearlyTotals[years[firstNZ]]) ** (1 / n) - 1) * 100;
          if (Number.isFinite(cagr)) cagrStr = ` (CAGR ${cagr >= 0 ? '+' : ''}${cagr.toFixed(1)}% since ${years[firstNZ]})`;
        }
        sentences.push(`Trade volumes <strong class="${yoyClass}">${dir} ${Math.abs(yoy).toFixed(1)}%</strong> from ${years[curIdx - 1]} to ${STATE.year}${cagrStr}.`);
      }
    }

    const allPartners = {};
    Object.entries(partnerExports).forEach(([p, v]) => {
      allPartners[p] = (allPartners[p] || 0) + v;
    });
    Object.entries(partnerImports).forEach(([p, v]) => {
      allPartners[p] = (allPartners[p] || 0) + v;
    });
    const topEntry = Object.entries(allPartners).sort((a, b) => b[1] - a[1])[0];

    const catTotals = {};
    let countryTotal = 0;
    (STATE.yearCache[STATE.year] || []).forEach(d => {
      if (d.exporter === iso || d.importer === iso) {
        catTotals[d.flowCategory] = (catTotals[d.flowCategory] || 0) + d.netValue;
        countryTotal += d.netValue;
      }
    });
    const domCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

    if (topEntry || domCat) {
      let s = '';
      if (topEntry) {
        const tpName = STATE.countryNames[topEntry[0]] || topEntry[0];
        s += `Top trading partner is <strong>${tpName}</strong>.`;
      }
      if (domCat && countryTotal > 0) {
        const domPct = Math.round((domCat[1] / countryTotal) * 100);
        s += ` <strong class="cat-strong ${FC[domCat[0]]}">${CAT_LABELS_ARROW[domCat[0]]}</strong> flows dominate at ${domPct}%.`;
      }
      if (s) sentences.push(s);
    }

    if (sentences.length === 0) return `<p class="si-narrative-empty">No trade data available for this country in the current view.</p>`;
    return sentences.map(s => `<p>${s}</p>`).join('');
  },

  updateDashboard(_rebuildMenus = true) {
    STATE.selectedExporters = new Set(this.exporterSelector.getSelectedCountries());
    STATE.selectedImporters = new Set(this.importerSelector.getSelectedCountries());

    // Auto-reset threshold only when transitioning from "some selected" → "none selected"
    const currentSelectionCount = STATE.selectedExporters.size + STATE.selectedImporters.size;
    if (currentSelectionCount === 0 && this._prevSelectionCount > 0 && STATE.thresholdMode !== 'auto') {
      STATE.thresholdMode = 'auto';
      const autoBtn = qs('.threshold-btn[data-threshold="auto"]');
      if (autoBtn) this.updateUIClasses('.threshold-btn', autoBtn);
    }
    this._prevSelectionCount = currentSelectionCount;

    DataLoader.filterData();
    TradeMap.renderFlows();
    this.updateKPIBar();

    if (this._lastRenderedRegion !== STATE.region) {
      this._lastRenderedRegion = STATE.region;
      setTimeout(() => TradeMap.zoomToRegion(STATE.region), 50);
    }
  },

  showTooltip(event, iso) {
    const tooltip = qs('.tooltip');
    const name = STATE.countryNames[iso] || iso;
    const stats = STATE.nodeStats[iso];
    const mf = METRIC_FORMAT[STATE.metric] || METRIC_FORMAT.value;

    const region = RegionConfig.getRegion(iso);
    const devStatus = CONFIG.development[iso] === 'north' ? 'Developed' : 'Developing';
    const regionTag = region && region !== 'Other' ? `<span class="tt-region">${region} · ${devStatus}</span>` : '';

    let content = `
      <div class="tt-head">
        <div class="tt-title">${name}</div>
        ${regionTag}
      </div>`;

    if (!stats) {
      tooltip.innerHTML = content;
      this._positionTooltip(tooltip, event);
      return;
    }

    const isNetExporter = stats.netBalance >= 0;
    const balanceSign = isNetExporter ? '+' : '';
    const roleLabel = isNetExporter ? 'Net Exporter' : 'Net Importer';
    const roleClass = isNetExporter ? 'exp' : 'imp';
    const balanceClass = isNetExporter ? 'col-exp' : 'col-imp';

    content += `
      <div class="tt-grid">
        <div class="tt-card">
          <div class="tt-card-label">${mf.grossLabel.replace(':', '')}</div>
          <div class="tt-card-value">${mf.fmt(stats.grossVolume)}</div>
        </div>
        <div class="tt-card">
          <div class="tt-card-label">${mf.netLabel.replace(':', '')}</div>
          <div class="tt-card-value ${balanceClass}">${balanceSign}${mf.fmt(Math.abs(stats.netBalance))}</div>
        </div>
      </div>
      <div class="tt-role-wrap">
        <span class="tt-role-badge ${roleClass}">${roleLabel}</span>
      </div>`;

    const partnerExports = {};
    const partnerImports = {};
    STATE.filteredData.forEach(d => {
      if (d.exporter === iso) {
        partnerExports[d.importer] = (partnerExports[d.importer] || 0) + d.netValue;
      } else if (d.importer === iso) {
        partnerImports[d.exporter] = (partnerImports[d.exporter] || 0) + d.netValue;
      }
    });

    const allPartners = {};
    Object.entries(partnerExports).forEach(([p, v]) => {
      allPartners[p] = (allPartners[p] || 0) + v;
    });
    Object.entries(partnerImports).forEach(([p, v]) => {
      allPartners[p] = (allPartners[p] || 0) + v;
    });

    const topPartners = Object.entries(allPartners)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (topPartners.length > 0) {
      const maxPVal = topPartners[0][1];
      const partnerRows = topPartners
        .map(([pIso, val]) => {
          const pName = STATE.countryNames[pIso] || pIso;
          const shortName = pName.length > 14 ? `${pName.slice(0, 13)}…` : pName;
          const barPct = Math.round((val / maxPVal) * 100);
          const isExportTo = !!partnerExports[pIso];
          const arrow = isExportTo ? '→' : '←';
          const arrowClass = isExportTo ? 'col-exp' : 'col-imp';
          const barBgClass = isExportTo ? 'bg-exp' : 'bg-imp';
          return `
            <div class="tt-partner-row">
              <span class="tt-partner-arrow ${arrowClass}">${arrow}</span>
              <span class="tt-partner-name">${shortName}</span>
              <div class="tt-partner-bar">
                <div class="tt-partner-bar-fill ${barBgClass}" style="--pct: ${barPct}%"></div>
              </div>
              <span class="tt-partner-val">${mf.fmt(val)}</span>
            </div>`;
        })
        .join('');

      content += `
        <div class="tt-section">
          <div class="tt-section-label">Top Partners</div>
          ${partnerRows}
        </div>`;
    }

    const catTotals = {};
    let countryTotal = 0;
    (STATE.yearCache[STATE.year] || []).forEach(d => {
      if (d.exporter === iso || d.importer === iso) {
        catTotals[d.flowCategory] = (catTotals[d.flowCategory] || 0) + d.netValue;
        countryTotal += d.netValue;
      }
    });

    if (countryTotal > 0) {
      const segments = Object.entries(catTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, val]) => ({ cat, pct: (val / countryTotal) * 100 }));

      const barSegments = segments.map(s => `<div class="tt-flow-seg ${FC[s.cat]}" style="--pct: ${s.pct}%"></div>`).join('');
      const labelSpans = segments.map(s => `<span class="tt-flow-label ${FC[s.cat]}">${CAT_LABELS_SHORT[s.cat]} ${Math.round(s.pct)}%</span>`).join('<span class="tt-flow-sep">·</span>');

      content += `
        <div class="tt-section has-extra-margin">
          <div class="tt-section-label">Flow Composition</div>
          <div class="tt-flow-bar">${barSegments}</div>
          <div class="tt-flow-labels">${labelSpans}</div>
        </div>`;
    }

    const yearlyTotals = {};
    const _isoTrend = STATE.trendSummary[iso] || {};
    for (let y = 2015; y <= 2024; y++) yearlyTotals[y] = _isoTrend[String(y)] || 0;

    const years = Object.keys(yearlyTotals).map(Number).sort();
    const yVals = years.map(y => yearlyTotals[y]);
    const maxYV = Math.max(...yVals);

    if (maxYV > 0) {
      const W = 140;
      const H = 28;
      const gap = 1;
      const barW = (W - gap * (years.length - 1)) / years.length;
      const bars = yVals
        .map((v, i) => {
          const h = Math.max(1, (v / maxYV) * H);
          const x = i * (barW + gap);
          const isCur = years[i] === STATE.year;
          return `<rect class="trend-bar${isCur ? ' cur' : ''}" x="${x}" y="${H - h}" width="${barW}" height="${h}" rx="1.5"/>`;
        })
        .join('');

      const curIdx = years.indexOf(STATE.year);
      let yoyHtml = '';
      if (curIdx > 0 && yVals[curIdx - 1] > 0) {
        const yoy = ((yVals[curIdx] - yVals[curIdx - 1]) / yVals[curIdx - 1]) * 100;
        const yoySign = yoy >= 0 ? '+' : '';
        yoyHtml = `<span class="tt-yoy ${yoy >= 0 ? 'col-positive' : 'col-negative'}">${yoySign}${yoy.toFixed(0)}% YoY</span>`;
      }
      let cagrHtml = '';
      const firstNonZeroIdx = yVals.findIndex(v => v > 0);
      if (firstNonZeroIdx >= 0 && curIdx > firstNonZeroIdx && yVals[firstNonZeroIdx] > 0 && yVals[curIdx] > 0) {
        const n = curIdx - firstNonZeroIdx;
        const cagr = ((yVals[curIdx] / yVals[firstNonZeroIdx]) ** (1 / n) - 1) * 100;
        if (Number.isFinite(cagr)) {
          cagrHtml = `<span class="tt-cagr ${cagr >= 0 ? 'col-positive' : 'col-negative'}">CAGR ${cagr >= 0 ? '+' : ''}${cagr.toFixed(1)}%</span>`;
        }
      }

      content += `
        <div class="tt-section has-extra-margin">
          <div class="tt-trend-head">
            <span class="tt-section-label">Trend</span>
            <div class="tt-trend-stats">${yoyHtml}${cagrHtml}</div>
          </div>
          <svg class="tt-trend-bars" width="${W}" height="${H}">${bars}</svg>
          <div class="tt-trend-axis">
            <span>${years[0]}</span><span>${years[years.length - 1]}</span>
          </div>
        </div>`;
    }

    if (region && region !== 'Other') {
      const regionCountries = Object.entries(STATE.nodeStats)
        .filter(([code]) => RegionConfig.getRegion(code) === region)
        .sort((a, b) => b[1].grossVolume - a[1].grossVolume);
      const rank = regionCountries.findIndex(([code]) => code === iso) + 1;
      const total = regionCountries.length;
      if (rank > 0) {
        content += `
          <div class="tt-rank">
            <span class="tt-rank-num">#${rank}</span>
            <span>of ${total} in ${region}</span>
            <span class="tt-rank-badge tt-role-badge ${roleClass}">${roleLabel}</span>
          </div>`;
      }
    }

    tooltip.innerHTML = content;
    this._positionTooltip(tooltip, event);
  },

  _positionTooltip(tooltip, event) {
    tooltip.classList.add('visible');
    const pad = 15;

    // Compute mouse position relative to the tooltip's container (map area)
    const container = tooltip.parentElement;
    const rect = container.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;

    // Default: place tooltip at the bottom-right of the cursor
    let x = mouseX + pad;
    let y = mouseY + pad;

    // Flip to the left if it would overflow the container's right edge
    if (x + tw > rect.width - pad) x = mouseX - tw - pad;
    // Flip above the cursor if it would overflow the bottom edge
    if (y + th > rect.height - pad) y = mouseY - th - pad;
    // Final safety: keep within left/top padding
    if (x < pad) x = pad;
    if (y < pad) y = pad;

    tooltip.style.setProperty('--tooltip-x', `${x}px`);
    tooltip.style.setProperty('--tooltip-y', `${y}px`);
  },

  hideTooltip() {
    qs('.tooltip').classList.remove('visible');
  },

  toggleMobileLegend() {
    const panel = qs('.legend-panel');
    const backdrop = qs('.mobile-legend-backdrop');
    const isOpen = panel.classList.contains('mobile-open');
    if (isOpen) {
      panel.classList.remove('mobile-open');
      backdrop.classList.add('hidden');
    } else {
      panel.classList.add('mobile-open');
      backdrop.classList.remove('hidden');
    }
  },

  toggleMobileFilter() {
    const panel = qs('.mobile-filter-panel');
    const backdrop = qs('.mobile-filter-backdrop');
    if (!panel) return;
    const isOpen = panel.classList.contains('open');
    if (isOpen) {
      panel.classList.remove('open');
      backdrop.classList.add('hidden');
    } else {
      panel.classList.add('open');
      backdrop.classList.remove('hidden');
    }
  },

  destroy() {
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._appRoot?.removeEventListener('shc:layout-change', this._resizeHandler);
      this._resizeHandler = null;
      this._appRoot = null;
    }
  },

  syncMobileFilterState() {
    const activeRegion = qs(`.region-btn[data-region="${STATE.region || 'Global'}"]`);
    if (activeRegion) this.updateUIClasses('.region-btn', activeRegion);
    const threshVal = STATE.thresholdMode === 'auto' || STATE.thresholdMode === undefined ? 'auto' : String(STATE.thresholdMode);
    const activeThreshold = qs(`.threshold-btn[data-threshold="${threshVal}"]`);
    if (activeThreshold) this.updateUIClasses('.threshold-btn', activeThreshold);
  }
};

export default App;
