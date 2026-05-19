import MainApp from './custom/main.js';

const REGIONS = ['Global', 'Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];

const YEARS = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];

const THRESHOLDS = [
  { value: 'auto', label: 'Auto' },
  { value: '10000000', label: '$10M' },
  { value: '1000000', label: '$1M' },
  { value: '500000', label: '$500k' },
  { value: '100000', label: '$100k' },
  { value: '10000', label: '$10k' }
];

const FLOWS = [
  { value: 'north-south', label: 'N→S', mobileLabel: 'N → S', cls: 'flow-ns' },
  { value: 'south-north', label: 'S→N', mobileLabel: 'S → N', cls: 'flow-sn' },
  { value: 'south-south', label: 'S→S', mobileLabel: 'S → S', cls: 'flow-ss' },
  { value: 'north-north', label: 'N→N', mobileLabel: 'N → N', cls: 'flow-nn' }
];

const ChevronDown = ({ size = 12 }) => (
  <svg className="picker-chevron" width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <title>Open</title>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <title>Close</title>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CountryPicker = ({ prefix, type, label }) => {
  const importerExtraBadge = prefix === 'imp' ? ' importer' : '';
  return (
    <div className="picker-wrapper">
      <button type="button" className={`country-picker-btn ${prefix}-btn`}>
        <div className="picker-labels">
          <span className="picker-type">{type}</span>
          <span className={`picker-value ${prefix}-label`}>{label}</span>
        </div>
        <div className="picker-trailing">
          <span className={`picker-badge${importerExtraBadge} ${prefix}-count hidden`} />
          <ChevronDown />
        </div>
      </button>
      <div className={`country-picker-menu ${prefix}-menu hidden`}>
        <div className="picker-search-area">
          <input type="text" className={`${prefix}-search`} placeholder={`Search ${type.split(' ')[0]}...`} />
          <button type="button" className={`picker-clear ${prefix}-clear-all`}>
            Clear
          </button>
        </div>
        <div className={`picker-list ${prefix}-list`} />
      </div>
    </div>
  );
};

const MobilePicker = ({ prefix, type, label }) => {
  const importerExtraBadge = prefix === 'imp' ? ' importer' : '';
  return (
    <div className="sheet-section">
      <div className="section-label">{type}</div>
      <button type="button" className={`picker-btn-full m-${prefix}-btn`}>
        <span className={`picker-value m-${prefix}-label`}>{label}</span>
        <div className="picker-trailing-lg">
          <span className={`picker-badge${importerExtraBadge} m-${prefix}-count hidden`} />
          <ChevronDown size={16} />
        </div>
      </button>
    </div>
  );
};

const FlowDot = cls => <span className={`method-flow-dot method-flow-dot-${cls}`} />;

const App = () => {
  return (
    <>
      <header className="main-header">
        <div className="header-inner">
          <div className="header-title">
            <img src="./assets/img/unctad-icon.svg" alt="UNCTAD" className="header-logo" />
            <div className="header-text">
              <h3>Global Second-Hand Clothes Trade Monitor</h3>
              <h4>UNCTAD &middot; SMEP project</h4>
            </div>
          </div>

          <div className="header-controls">
            <div className="ctrl-divider" />

            {/* Region filter */}
            <div className="ctrl-pill">
              {REGIONS.map((region, i) => (
                <button key={region} className={`region-btn btn-toggle${i === 0 ? ' active' : ''}`} data-region={region} title={region} type="button">
                  {i === 0 ? 'All' : region}
                </button>
              ))}
            </div>

            <div className="ctrl-divider" />

            {/* Year select */}
            <div className="ctrl-pill">
              <select className="ctrl-year year-select" defaultValue="2024">
                {YEARS.map(y => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Flow direction filter */}
            <div className="ctrl-pill" title="Filter by economic flow direction">
              <span className="ctrl-flows-label">Flows</span>
              {FLOWS.map(f => (
                <label key={f.value} className={`flow-label ${f.cls}`} title={f.value}>
                  <input type="checkbox" className="flow-checkbox" value={f.value} onChange={event => MainApp.changeFlowDirection(event)} />
                  <span>{f.label}</span>
                </label>
              ))}
            </div>
            <div className="ctrl-divider threshold-divider" />

            {/* Threshold filter */}
            <div className="ctrl-pill threshold-group" title="Visibility threshold - minimum trade value to display">
              {THRESHOLDS.map((t, i) => (
                <button key={t.value} className={`threshold-btn btn-toggle${i === 0 ? ' active' : ''}`} type="button" data-threshold={t.value}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="ctrl-divider" />

            <CountryPicker prefix="exp" type="Exporter (From)" label="All Exporters" />
            <CountryPicker prefix="imp" type="Importer (To)" label="All Importers" />
          </div>
        </div>
      </header>

      {/* Legend Bar (between filters and KPI) */}
      <div className="legend-panel">
        <div className="legend-mobile-header">
          <span>Legend</span>
          <button className="btn-close mobile-legend-close" type="button">
            <CloseIcon />
          </button>
        </div>
        <div className="legend-content" />
        <div className="total-stats">
          <div className="stat-row">
            <span className="stat-label">Shown</span>
            <span className="stat-val stat-value">—</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Bilateral</span>
            <span className="stat-secondary stat-bilateral">—</span>
          </div>
          <span className="stat-coverage" />
        </div>
        <div className="legend-footer">
          <img src="./assets/img/smep-logo.png" alt="SMEP" />
        </div>
      </div>

      {/* KPI Bar */}
      <div className="kpi-bar">
        <div className="kpi-inner">
          <div className="kpi-item" title="Active filter: region or country selection">
            <span className="kpi-label">Filter</span>
            <span className="kpi-value kpi-scope">Global</span>
          </div>
          <div className="kpi-divider" />
          <div className="kpi-item" title="Total trade value of visible flows (USD)">
            <span className="kpi-label">Volume</span>
            <span className="kpi-value kpi-total">—</span>
          </div>
          <div className="kpi-divider" />
          <div className="kpi-item" title="Number of bilateral trade corridors shown on map">
            <span className="kpi-label">Corridors</span>
            <span className="kpi-value kpi-flows">—</span>
          </div>
          <div className="kpi-divider" />
          <div className="kpi-item" title="Number of countries active in the current view">
            <span className="kpi-label">Countries</span>
            <span className="kpi-value kpi-countries">—</span>
          </div>
          <div className="kpi-divider" />
          <div className="kpi-item kpi-item-col" title="Largest net exporter by trade balance (includes all flows, before threshold)">
            <span className="kpi-label">#1 Exporter</span>
            <span className="kpi-value kpi-value-exp kpi-top-exp">—</span>
          </div>
          <div className="kpi-divider" />
          <div className="kpi-item kpi-item-col" title="Largest net importer by trade balance (includes all flows, before threshold)">
            <span className="kpi-label">#1 Importer</span>
            <span className="kpi-value kpi-value-imp kpi-top-imp">—</span>
          </div>
          <div className="kpi-divider" />
          <div className="kpi-item" title="North-to-South flows as share of total visible trade value">
            <span className="kpi-label">N→S</span>
            <span className="kpi-value kpi-value-ns kpi-ns-pct">—</span>
          </div>
          <div className="kpi-divider" />
          <div className="kpi-item" title="South-to-South flows as share of total visible trade value">
            <span className="kpi-label">S→S</span>
            <span className="kpi-value kpi-value-ss kpi-ss-pct">—</span>
          </div>
        </div>
      </div>

      <main>
        {/* Map + Overlays */}
        <div className="map-area">
          <div className="map-container" />

          <div className="tooltip" />

          {/* Insight Side Panel */}
          <div className="insight-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <div className="panel-country-name-row">
                  <div className="panel-country-name">—</div>
                  <button className="searoute-btn" type="button" title="Show actual shipping routes (experimental feature)" disabled>
                    <span className="searoute-btn-label">Sea Route</span>
                    <span className="searoute-experimental-badge">EXPERIMENTAL</span>
                  </button>
                </div>
                <div className="panel-country-meta">—</div>
              </div>
              <button className="btn-close panel-close-btn" title="Close" type="button">
                <CloseIcon />
              </button>
            </div>
            <div className="panel-body">
              <div className="placeholder-msg">Click a country on the map</div>
            </div>
          </div>

          {/* Arc Detail Modal */}
          <div className="arc-modal hidden">
            <div className="modal-backdrop arc-modal-backdrop" />
            <div className="modal-card">
              <div className="modal-header">
                <div>
                  <div className="modal-title arc-modal-title">—</div>
                  <div className="modal-subtitle arc-modal-meta">Bilateral Trade History</div>
                </div>
                <button className="btn-close arc-modal-close" type="button">
                  <CloseIcon />
                </button>
              </div>
              <div className="modal-body arc-modal-body" />
            </div>
          </div>

          {/* Compare Modal */}
          <div className="compare-modal hidden">
            <div className="modal-backdrop compare-modal-backdrop" />
            <div className="modal-card">
              <div className="modal-header">
                <div className="modal-title compare-modal-title">Country Comparison</div>
                <button className="btn-close compare-modal-close" type="button">
                  <CloseIcon />
                </button>
              </div>
              <div className="modal-body compare-modal-body" />
            </div>
          </div>

          {/* Mobile FABs */}
          <button className="mobile-legend-btn" type="button">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <title>Legend</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Legend
          </button>

          <button className="fit-screen-btn" title="Fit to screen" type="button">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <title>Fit to screen</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>

          <button className="mobile-filter-btn" type="button">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <title>Filter</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            <span className="filter-badge mobile-filter-badge" />
          </button>

          {/* Backdrops (initially hidden, JS toggles .hidden) */}
          <div className="mobile-legend-backdrop hidden" />
          <div className="mobile-filter-backdrop hidden" />
          <div className="mobile-country-backdrop hidden" />

          <div className="loader">
            <div className="loader-spinner" />
            <p>Loading Trade Data...</p>
          </div>
        </div>
      </main>

      {/* Map Footer */}
      <footer className="map-footer">
        <p>Source: BACI based on UN Comtrade. Data cover HS&nbsp;6309 (Worn clothing and other worn articles).</p>
        <p>
          Note: Sea routes are shown only for flows between different UNCTAD regions (Africa, Americas, Asia, Europe, Oceania) and represent major maritime shipping lanes computed via the Eurostat <em>searoute</em> algorithm using representative ports based on UNCTAD PLSCI scores. Flows within the same region are shown
          as arcs. Routes do not reflect actual tracked second-hand clothing (HS&nbsp;6309) cargo paths and may not represent the actual mode of transport used.
        </p>
        <p className="footer-method-link">
          <button className="footer-link-btn methodology-btn" type="button">
            Methodology &amp; Data Sources
          </button>
        </p>
      </footer>

      {/* Methodology Modal */}
      <div className="methodology-modal hidden">
        <div className="modal-backdrop methodology-modal-backdrop" />
        <div className="modal-card methodology-card">
          <div className="modal-header">
            <div>
              <div className="modal-title">Methodology &amp; Data Sources</div>
              <div className="modal-subtitle">Global Second-Hand Clothes Trade Monitor &mdash; Technical Notes</div>
            </div>
            <button className="btn-close methodology-modal-close" type="button">
              <CloseIcon />
            </button>
          </div>
          <div className="modal-body method-body">
            <section className="method-section">
              <h3 className="method-section-title">Data Source</h3>
              <dl className="method-dl">
                <dt>Database</dt>
                <dd>BACI International Trade Database (CEPII), derived from UN Comtrade mirror data. Harmonized bilateral trade flows at the HS 6-digit level.</dd>
                <dt>Product coverage</dt>
                <dd>
                  HS&nbsp;6309 — <em>Worn clothing and other worn articles.</em> Includes second-hand garments traded in bulk regardless of quality grade.
                </dd>
                <dt>Years available</dt>
                <dd>2015–2024 (provisional for the most recent year)</dd>
                <dt>Value unit</dt>
                <dd>Current USD (thousands, then converted to display units)</dd>
              </dl>
            </section>

            <section className="method-section">
              <h3 className="method-section-title">Flow Direction Classification</h3>
              <p className="method-note">
                Countries are classified as <strong>North</strong> (developed) or <strong>South</strong> (developing/least-developed) using the UNCTAD Development Status classification, consistent with UNCTAD flagship publications.
              </p>
              <dl className="method-dl">
                <dt>{FlowDot('ns')} N&rarr;S</dt>
                <dd>Export from a developed economy to a developing economy</dd>
                <dt>{FlowDot('sn')} S&rarr;N</dt>
                <dd>Export from a developing economy to a developed economy</dd>
                <dt>{FlowDot('ss')} S&rarr;S</dt>
                <dd>Both exporter and importer are developing or least-developed economies</dd>
                <dt>{FlowDot('nn')} N&rarr;N</dt>
                <dd>Both exporter and importer are developed economies</dd>
              </dl>
            </section>

            <section className="method-section">
              <h3 className="method-section-title">Trade Flow Calculation</h3>
              <dl className="method-dl">
                <dt>Net bilateral flow</dt>
                <dd>For each country pair (A, B), the net flow equals the larger reported value between A&rarr;B and B&rarr;A exports. The dominant direction determines the arc direction. This reduces double-counting from mirror reporting in UN Comtrade.</dd>
                <dt>Arc width</dt>
                <dd>Scaled proportionally to the net trade value on a square-root scale to prevent large flows from dominating small ones visually.</dd>
                <dt>Arc curvature</dt>
                <dd>
                  All arcs curve in a consistent clockwise direction (SVG <code>sweep-flag = 1</code>). This means eastward flows bend northward and westward flows bend southward, providing a secondary visual cue for flow direction that complements the color encoding.
                </dd>
              </dl>
            </section>

            <section className="method-section">
              <h3 className="method-section-title">Display Threshold (Auto Mode)</h3>
              <p className="method-note">
                To avoid visual overload, the map limits the number of displayed arcs to a maximum of <strong>40</strong> at a time.
              </p>
              <dl className="method-dl">
                <dt>Global view</dt>
                <dd>Minimum threshold: $10&thinsp;M. Arcs below this value are hidden.</dd>
                <dt>With country selection</dt>
                <dd>Floor scales down with selection breadth (1–3 countries: $10&thinsp;K; 4–10: $100&thinsp;K; 11–30: $500&thinsp;K; 31+: $1&thinsp;M). If the number of arcs above the floor exceeds 40, the threshold is raised to the 40th-highest value.</dd>
                <dt>Manual thresholds</dt>
                <dd>Fixed cut-off values ($10&thinsp;k – $10&thinsp;M) override the automatic algorithm.</dd>
              </dl>
            </section>

            <section className="method-section">
              <h3 className="method-section-title">Partner Concentration (HHI)</h3>
              <p className="method-note">Shown in the country detail panel when a country is clicked. Measures how much a country&rsquo;s trade is spread across partners versus concentrated in just a few - analogous to asking &ldquo;does this country trade with everyone, or depend heavily on one partner?&rdquo;</p>
              <dl className="method-dl">
                <dt>Index used</dt>
                <dd>Herfindahl&ndash;Hirschman Index (HHI): the sum of squared partner trade shares, scaled to 0&ndash;10&thinsp;000. A score of 10&thinsp;000 means 100% of trade goes to a single partner; a score near 0 means trade is evenly spread across many partners.</dd>
                <dt>Formula</dt>
                <dd>
                  <code>
                    HHI = &sum;(share<sub>i</sub>&sup2;) &times; 10&thinsp;000
                  </code>
                  , where share<sub>i</sub> is each partner&rsquo;s fraction of that country&rsquo;s total bilateral trade value.
                </dd>
                <dt>Interpretation</dt>
                <dd>
                  <span className="method-hhi-band method-hhi-band-diversified">&#9632;</span> <strong>Diversified</strong> (0–2&thinsp;000): trade spread across many partners
                  <br />
                  <span className="method-hhi-band method-hhi-band-moderate">&#9632;</span> <strong>Moderate</strong> (2&thinsp;000–4&thinsp;000): some partners dominate but diversification remains
                  <br />
                  <span className="method-hhi-band method-hhi-band-concentrated">&#9632;</span> <strong>Highly concentrated</strong> (&gt;4&thinsp;000): trade heavily dependent on one or two partners
                </dd>
                <dt>Threshold note</dt>
                <dd>
                  These bands are calibrated for international trade dependency analysis. They are deliberately lower than the antitrust thresholds used in competition law (which start at 2&thinsp;500 for &ldquo;concentrated markets&rdquo;), reflecting that even moderate trade concentration poses diversification risks.
                </dd>
                <dt>Data scope</dt>
                <dd>Computed from all net bilateral flows for the selected year, regardless of the display threshold. This ensures the score is not distorted by the map&rsquo;s visibility filter.</dd>
              </dl>
            </section>

            <section className="method-section">
              <h3 className="method-section-title">Maritime Route Visualization</h3>
              <dl className="method-dl">
                <dt>Coverage</dt>
                <dd>Sea routes are displayed only for trade flows between different UNCTAD regions (Africa, Americas, Asia, Europe, Oceania). Flows within the same region are shown as straight arcs to avoid visual clutter from short intra-regional routes.</dd>
                <dt>Algorithm</dt>
                <dd>
                  Routes are computed using the Eurostat <em>searoute</em> algorithm over a navigable sea graph.
                </dd>
                <dt>Port selection</dt>
                <dd>
                  Representative ports are chosen based on UNCTAD Liner Shipping Connectivity Index (LSCI) scores; the highest-ranked port in each country is used as the routing node. For large countries spanning multiple coasts (United States, Canada, Australia), the nearest coast port to the partner country is
                  selected.
                </dd>
                <dt>Disclaimer</dt>
                <dd>Routes are indicative only. They do not represent actual tracked HS&nbsp;6309 cargo paths, may not reflect the mode of transport used, and should not be used for navigation.</dd>
              </dl>
            </section>

            <section className="method-section">
              <h3 className="method-section-title">Map Disclaimer</h3>
              <p className="method-note">
                The boundaries and names shown on this map do not imply official endorsement or acceptance by the United Nations. Dotted and dashed lines represent approximate borders for which the final status has not yet been determined. The designation of countries or territories does not imply the expression of any
                opinion on the part of UNCTAD concerning their legal status.
              </p>
            </section>

            <section className="method-section method-section-last">
              <h3 className="method-section-title">How to Cite</h3>
              <p className="method-cite">
                UNCTAD (2025). <em>Global Second-Hand Clothes Trade Monitor.</em> United Nations Conference on Trade and Development, Geneva.
              </p>
            </section>
          </div>
        </div>
      </div>

      {/* Mobile Filter Panel (bottom sheet) */}
      <div className="mobile-filter-panel">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <span>Filters</span>
          <button className="btn-close mobile-filter-close" type="button">
            <CloseIcon />
          </button>
        </div>
        <div className="sheet-body">
          <div className="sheet-section">
            <div className="section-label">Region</div>
            <div className="filter-row">
              {REGIONS.map(region => (
                <button key={region} className="region-btn btn-toggle-lg" data-region={region} type="button">
                  {region === 'Global' ? 'All' : region}
                </button>
              ))}
            </div>
          </div>

          <div className="sheet-section">
            <div className="section-label">Year</div>
            <select className="sheet-select m-year-select">
              {YEARS.map(y => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="sheet-section">
            <div className="section-label">Flow Direction</div>
            <div className="filter-grid-2">
              {FLOWS.map(f => (
                <label key={f.value} className={`flow-label-lg ${f.cls}`}>
                  <input type="checkbox" className="flow-checkbox" value={f.value} onChange={event => MainApp.changeFlowDirection(event)} />
                  <span>{f.mobileLabel}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="sheet-section">
            <div className="section-label">Min. Trade Value</div>
            <div className="filter-row">
              {THRESHOLDS.map(t => (
                <button key={t.value} className="threshold-btn btn-toggle-lg" data-threshold={t.value} type="button">
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <MobilePicker prefix="exp" type="Exporter (From)" label="All Exporters" />
          <MobilePicker prefix="imp" type="Importer (To)" label="All Importers" />
        </div>
      </div>
    </>
  );
};

export default App;
