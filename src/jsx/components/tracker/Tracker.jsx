// Ported from UNCTAD-TED/SHC-trade-visualization: index.html <body> (commit 9e98152).
import { ASSET_BASE } from './custom/dom.js';

const Tracker = () => (
  <>
    {/* Header */}
    <header className="main-header">
      <div className="header-inner">
        <div className="header-title">
          <img alt="UNCTAD" className="header-logo" src={`${ASSET_BASE}assets/img/unctad-icon.svg`} />
          <div className="header-text">
            <h3>Global Second-Hand Clothes Trade Monitor</h3>
            <h4>UN Trade and Development (UNCTAD) &middot; Sustainable Manufacturing and Environmental Pollution (SMEP) Programme &middot; HS&nbsp;6309 worn clothing</h4>
          </div>
        </div>
        {/* View modes */}
        <nav className="mode-tabs" aria-label="View mode">
          <button className="mode-tab js-mode active mode-explore-btn" data-mode="explore" type="button" aria-pressed="true" title="Explore: filter the trade flows by year, region, country and direction">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18" />
              <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z" />
            </svg>{' '}
            Explore
          </button>{' '}
          <button className="mode-tab js-mode linefilter-btn" data-mode="connect" type="button" aria-pressed="false" title="Connect: click two countries on the map to draw and compare their trade">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="5" cy="6" r="2.4" />
              <circle cx="19" cy="18" r="2.4" />
              <path d="M6.7 7.6 17.3 16.4" />
            </svg>{' '}
            Connect
          </button>{' '}
          <button className="mode-tab js-mode anim-btn" data-mode="animate" type="button" aria-pressed="false" title="Animate: play 2015–2024 as a bar-chart race">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M10 8.5v7l6-3.5z" fill="currentColor" stroke="none" />
            </svg>{' '}
            Animate
          </button>
        </nav>
        {/* Help and download */}
        <div className="header-utils">
          <button className="util-btn tour-btn" type="button" title="Guided tour of the monitor" aria-label="Guided tour">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.6 9.2a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6" />
              <circle cx="12" cy="16.9" r=".7" fill="currentColor" stroke="none" />
            </svg>{' '}
            <span className="util-label">Guided tour</span>
          </button>{' '}
          <button className="util-btn js-open-methodology methodology-btn" type="button" title="Methodology and data sources" aria-label="Methodology and data sources">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v6" />
              <circle cx="12" cy="7.6" r=".7" fill="currentColor" stroke="none" />
            </svg>{' '}
            <span className="util-label">Methodology</span>
          </button>{' '}
          {/* CSV export */}
          <div className="picker-wrapper export-wrapper">
            <button className="util-btn util-btn-primary export-btn" type="button" aria-haspopup="true" aria-expanded="false" title="Download the flows of the current view as a CSV table" aria-label="Download">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M7 10l5 5 5-5" />
                <path d="M12 15V3" />
              </svg>{' '}
              <span className="util-label">Download</span>
            </button>
            <div className="export-menu hidden" role="menu">
              <div className="export-menu-hdr">
                <span>Current view</span> <span className="export-scope">—</span>
              </div>
              <button className="export-opt" data-export="flows" role="menuitem" type="button">
                <span className="export-opt-title">Trade flows (CSV)</span> <span className="export-opt-sub">One row per net flow · net value and weight, gross flow and unit value</span>
              </button>{' '}
              <button className="export-opt" data-export="summary" role="menuitem" type="button">
                <span className="export-opt-title">Country summary (CSV)</span> <span className="export-opt-sub">Ranked · net flows in this view, role, top partner, HHI</span>
              </button>
              <div className="export-menu-foot">Covers every net flow in the current region or selection, or your drawn connections. The minimum flow size is ignored; the Lines limit and the flow-direction filters are applied. For one country or one corridor, use the CSV button in its panel.</div>
            </div>
          </div>
        </div>
        {/* Shown only while the animation runs */}
        <div className="anim-header-right">
          <img alt="SMEP / UNCTAD / UK International Development" className="anim-smep-logo" src={`${ASSET_BASE}assets/img/smep-logo.png`} />{' '}
          <button type="button" title="Stop the animation and return to the map" className="anim-stop-btn">
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <rect width="10" height="10" fill="currentColor" />
            </svg>
            Stop
          </button>
        </div>
      </div>
    </header>
    {/* Filter bar */}
    <div role="toolbar" aria-label="Filters" className="filter-bar">
      <div className="filter-inner">
        <div className="fctl year-group">
          <label className="fctl-label fctl-label-opt" htmlFor="shc-year-select">
            Year
          </label>
          <select id="shc-year-select" className="fselect year-select" title="Year" defaultValue="2024">
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
            <option value="2020">2020</option>
            <option value="2019">2019</option>
            <option value="2018">2018</option>
            <option value="2017">2017</option>
            <option value="2016">2016</option>
            <option value="2015">2015</option>
          </select>
        </div>
        {/* Metric: value or weight */}
        <div className="fctl metric-group" title="Trade value (US dollars) or trade weight (tonnes)">
          <span className="fctl-label fctl-label-opt">Measure</span>
          <fieldset className="seg" aria-label="Measure">
            <button className="metric-btn seg-btn active" data-metric="value" type="button">
              Value
            </button>{' '}
            <button className="metric-btn seg-btn" data-metric="weight" type="button">
              Weight
            </button>
          </fieldset>
        </div>
        <span className="fsep explore-only" /> {/* Region filter */}
        <div className="fctl explore-only region-group" title="Show trade within one region (both partners in the region)">
          <label className="fctl-label fctl-label-opt" htmlFor="shc-region-select">
            Region
          </label>
          <select id="shc-region-select" className="fselect region-select" defaultValue="Global">
            <option value="Global">World</option>
            <option value="Africa">Africa</option>
            <option value="Americas">Americas</option>
            <option value="Asia">Asia</option>
            <option value="Europe">Europe</option>
            <option value="Oceania">Oceania</option>
          </select>
        </div>
        {/* Exporter picker */}
        <div className="fctl explore-only picker-wrapper">
          <button className="country-picker-btn exp-btn" type="button" aria-haspopup="listbox" aria-expanded="false" title="Only net flows from the selected economies">
            <div className="picker-labels">
              <span className="picker-type">From</span> <span className="picker-value exp-label">All Exporters</span>
            </div>
            <div className="picker-trailing">
              <span className="picker-badge hidden exp-count" />{' '}
              <svg className="picker-chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          <div className="country-picker-menu hidden exp-menu">
            <div className="picker-search-area">
              <input type="text" placeholder="Search exporters…" aria-label="Search exporters" className="exp-search" />{' '}
              <button className="picker-clear exp-clear-all" type="button">
                Clear
              </button>{' '}
              <button className="picker-done" type="button">
                Done
              </button>
            </div>
            <div className="picker-list exp-list" />
          </div>
        </div>
        {/* Importer picker */}
        <div className="fctl explore-only picker-wrapper">
          <button className="country-picker-btn imp-btn" type="button" aria-haspopup="listbox" aria-expanded="false" title="Only net flows to the selected economies">
            <div className="picker-labels">
              <span className="picker-type">To</span> <span className="picker-value imp-label">All Importers</span>
            </div>
            <div className="picker-trailing">
              <span className="picker-badge importer hidden imp-count" />{' '}
              <svg className="picker-chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          <div className="country-picker-menu hidden imp-menu">
            <div className="picker-search-area">
              <input type="text" placeholder="Search importers…" aria-label="Search importers" className="imp-search" />{' '}
              <button className="picker-clear imp-clear-all" type="button">
                Clear
              </button>{' '}
              <button className="picker-done" type="button">
                Done
              </button>
            </div>
            <div className="picker-list imp-list" />
          </div>
        </div>
        <span className="fsep" /> {/* Flow direction filter */}
        <fieldset className="fctl flow-filter-group" aria-label="Flow direction">
          <span className="fctl-label">Flows</span>
          <div className="flow-chips">
            <label className="flow-chip flow-ns" title="North → South: from developed to developing economies">
              <input type="checkbox" className="flow-checkbox" value="north-south" defaultChecked />{' '}
              <span className="chip-body">
                <span className="chip-swatch" />
                N&rarr;S
              </span>
            </label>{' '}
            <label className="flow-chip flow-sn" title="South → North: from developing to developed economies">
              <input type="checkbox" className="flow-checkbox" value="south-north" defaultChecked />{' '}
              <span className="chip-body">
                <span className="chip-swatch" />
                S&rarr;N
              </span>
            </label>{' '}
            <label className="flow-chip flow-ss" title="South → South: between developing economies">
              <input type="checkbox" className="flow-checkbox" value="south-south" defaultChecked />{' '}
              <span className="chip-body">
                <span className="chip-swatch" />
                S&rarr;S
              </span>
            </label>{' '}
            <label className="flow-chip flow-nn" title="North → North: between developed economies">
              <input type="checkbox" className="flow-checkbox" value="north-north" defaultChecked />{' '}
              <span className="chip-body">
                <span className="chip-swatch" />
                N&rarr;N
              </span>
            </label>
          </div>
        </fieldset>
        {/* Lines on the map (replaces the "Top 20" threshold button) */}
        <div className="fctl explore-only picker-wrapper display-wrapper">
          <button className="fbtn display-btn" type="button" aria-haspopup="true" aria-expanded="false" title="Which flows are drawn: minimum flow size and maximum number of lines">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h11M4 17h6" />
            </svg>{' '}
            <span className="fbtn-k">Lines</span> <span className="display-summary">Auto</span>{' '}
            <svg className="picker-chevron" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="pop-menu align-right hidden display-menu" role="dialog" aria-label="Lines on the map">
            <div className="pop-sec">
              <div className="pop-title">Minimum flow size</div>
              <fieldset className="seg seg-wrap threshold-group" aria-label="Minimum flow size">
                <button className="threshold-btn seg-btn active" data-threshold="auto" type="button">
                  Auto
                </button>{' '}
                <button className="threshold-btn seg-btn" data-threshold="10000000" type="button">
                  $10M
                </button>{' '}
                <button className="threshold-btn seg-btn" data-threshold="1000000" type="button">
                  $1M
                </button>{' '}
                <button className="threshold-btn seg-btn" data-threshold="500000" type="button">
                  $500K
                </button>{' '}
                <button className="threshold-btn seg-btn" data-threshold="100000" type="button">
                  $100K
                </button>{' '}
                <button className="threshold-btn seg-btn" data-threshold="10000" type="button">
                  $10K
                </button>
              </fieldset>
              <p className="pop-hint">
                <b>Auto</b> draws the largest net flows, at most 40, and none below a minimum that depends on the view (world, a region, or the countries picked), so a region may show only a few lines. A fixed value draws every net flow at or above it.
              </p>
            </div>
            <div className="pop-sec">
              <div className="pop-title">Maximum number of lines</div>
              <fieldset className="seg seg-wrap topn-group" aria-label="Maximum number of lines">
                <button className="topn-btn seg-btn active" data-topn="all" type="button" title="No separate maximum: the minimum flow size decides how many lines are drawn">
                  Auto
                </button>{' '}
                <button className="topn-btn seg-btn" data-topn="50" type="button">
                  50
                </button>{' '}
                <button className="topn-btn seg-btn" data-topn="100" type="button">
                  100
                </button>{' '}
                <button className="topn-btn seg-btn" data-topn="200" type="button">
                  200
                </button>{' '}
                <button className="topn-btn seg-btn" data-topn="500" type="button">
                  500
                </button>
              </fieldset>
              <p className="pop-hint">
                <b>Auto</b> lets the minimum flow size decide: at most 40 lines with an Auto minimum, every net flow at or above a fixed value. A number draws only the N largest net flows; with an Auto minimum it replaces the automatic minimum and the 40-line cap, with a fixed value both limits apply.
              </p>
            </div>
          </div>
        </div>
        {/* Connect mode tools */}
        <div className="connect-tools connect-only">
          <span className="connect-step">
            <span className="connect-step-icon" aria-hidden="true">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="5" cy="6" r="2.4" />
                <circle cx="19" cy="18" r="2.4" />
                <path d="M6.7 7.6 17.3 16.4" />
              </svg>
            </span>{' '}
            <span className="connect-hint">
              Click an <b>exporter</b> on the map, then an <b>importer</b>.
            </span>
          </span>{' '}
          <button className="fbtn fbtn-danger hidden linefilter-clear" type="button">
            Clear connections
          </button>
        </div>
        <button className="fbtn fbtn-ghost explore-only filters-reset" type="button" title="Back to the world view with all countries and flow directions and Auto lines (year and measure are kept)" disabled>
          Reset
        </button>
      </div>
    </div>
    {/* Key figures (replaces the four-item bar of b701035) */}
    <div className="kpi-bar">
      <div className="kpi-inner">
        <div className="kpi-item kpi-scope" title="What the figures and the map cover">
          <span className="kpi-label">View</span> <span className="kpi-value kpi-scope-value">World</span>
        </div>
        <div className="kpi-divider" />
        <div className="kpi-item" title="Sum of the net flows drawn on the map, and its share of all net flows in the current region or selection (before the minimum flow size, the Lines limit and the flow-direction filters)">
          <span className="kpi-label">On map</span> <span className="kpi-value kpi-total">—</span>{' '}
          <span className="kpi-sub">
            <span className="stat-coverage">—</span> of <span className="stat-bilateral">—</span>
          </span>
        </div>
        <div className="kpi-divider" />
        <div className="kpi-item" title="Number of net flows drawn on the map">
          <span className="kpi-label">Lines</span> <span className="kpi-value kpi-flows">—</span>
        </div>
        <div className="kpi-divider" />
        <div className="kpi-item" title="Number of economies connected by the flows drawn on the map">
          <span className="kpi-label">Economies</span> <span className="kpi-value kpi-countries">—</span>
        </div>
        <div className="kpi-divider" />
        <div className="kpi-item" title="Largest net exporter (exports minus imports) over all flows in the current region or selection — before the minimum flow size, the Lines limit and the flow-direction filters">
          <span className="kpi-label">Top net exporter</span> <span className="kpi-value kpi-value-exp kpi-top-exp">—</span>
        </div>
        <div className="kpi-divider" />
        <div className="kpi-item" title="Largest net importer (imports minus exports) over all flows in the current region or selection — before the minimum flow size, the Lines limit and the flow-direction filters">
          <span className="kpi-label">Top net importer</span> <span className="kpi-value kpi-value-imp kpi-top-imp">—</span>
        </div>
        <div className="kpi-divider kpi-share-div" />
        <div className="kpi-item kpi-share" title="North → South share of the net flows drawn on the map">
          <span className="kpi-label">N&rarr;S share</span> <span className="kpi-value kpi-value-ns kpi-ns-pct">—</span>
        </div>
        <div className="kpi-divider kpi-share-div" />
        <div className="kpi-item kpi-share" title="South → South share of the net flows drawn on the map">
          <span className="kpi-label">S&rarr;S share</span> <span className="kpi-value kpi-value-ss kpi-ss-pct">—</span>
        </div>
      </div>
    </div>
    <main>
      {/* Map + Overlays */}
      <div className="map-area">
        <div className="map-container" />
        {/* Nothing matches the filters */}
        <div className="hidden map-empty" role="status">
          <p>No net flows match these filters.</p>
          <button type="button" className="map-empty-reset">
            Reset filters
          </button>
        </div>
        {/* Connect mode status */}
        <div className="hidden linefilter-status" role="status" />
        <div className="tooltip" />
        {/* Zoom controls (replace the .zoom-controls buttons of 71b0b23) */}
        <div className="map-tools">
          <button className="map-tool-btn zoom-in-btn" type="button" title="Zoom in" aria-label="Zoom in">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>{' '}
          <button className="map-tool-btn zoom-out-btn" type="button" title="Zoom out" aria-label="Zoom out">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M5 12h14" />
            </svg>
          </button>{' '}
          <button className="map-tool-btn fit-screen-btn" type="button" title="Reset the map view" aria-label="Reset the map view">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
            </svg>
          </button>
        </div>
        {/* Legend */}
        <section aria-label="Legend" className="legend-panel">
          <button className="legend-head legend-toggle" type="button" aria-expanded="true" aria-controls="shc-legend-content">
            <span>Legend</span>{' '}
            <svg className="legend-head-chevron" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div id="shc-legend-content" className="legend-content" />
        </section>
        {/* Country insight panel */}
        <aside aria-label="Details" className="insight-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <div className="panel-country-name-row">
                <div className="panel-country-name">—</div>
              </div>
              <div className="panel-country-meta">—</div>
              <button className="searoute-btn" type="button" title="Show indicative sea routes (experimental)" aria-pressed="false" disabled>
                <span className="searoute-btn-label">Sea routes</span> <span className="searoute-experimental-badge">(experimental)</span>
              </button>
            </div>
            <button className="focus-export-btn panel-export-btn" type="button" title="Download this country's data (CSV)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M7 10l5 5 5-5" />
                <path d="M12 15V3" />
              </svg>{' '}
              CSV
            </button>{' '}
            <button className="focus-export-btn hidden panel-clear-btn" type="button" title="Remove every drawn connection">
              Clear all
            </button>{' '}
            <button className="btn-close panel-close-btn" type="button" title="Close" aria-label="Close">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="panel-body">
            <div style={{ textAlign: 'center', color: '#AEA29A', fontSize: '12px', padding: '32px 0' }}>Click a country on the map</div>
          </div>
        </aside>
        {/* Corridor history pop-up */}
        <div className="hidden arc-modal">
          <div className="modal-backdrop arc-modal-backdrop" />
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="shc-arc-modal-title">
            <div className="modal-header">
              <div>
                <div id="shc-arc-modal-title" className="modal-title arc-modal-title">
                  —
                </div>
                <div className="modal-subtitle arc-modal-meta">Bilateral trade history</div>
              </div>
              <button className="focus-export-btn arc-export-btn" type="button" title="Download this corridor's 10-year history (CSV)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path d="M7 10l5 5 5-5" />
                  <path d="M12 15V3" />
                </svg>{' '}
                CSV
              </button>{' '}
              <button className="btn-close arc-modal-close" type="button" aria-label="Close">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body arc-modal-body" />
          </div>
        </div>
        {/* Country comparison pop-up */}
        <div className="hidden compare-modal">
          <div className="modal-backdrop compare-modal-backdrop" />
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="shc-compare-modal-title">
            <div className="modal-header">
              <div id="shc-compare-modal-title" className="modal-title compare-modal-title">
                Country comparison
              </div>
              <button className="btn-close compare-modal-close" type="button" aria-label="Close">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body compare-modal-body" />
          </div>
        </div>
        {/* Backdrops (initially hidden, JS toggles .hidden) */}
        <div className="hidden mobile-filter-backdrop" />
        <div className="hidden mobile-country-backdrop" />
        <div className="loader">
          <div className="loader-spinner" />
          <p>Loading trade data…</p>
        </div>
      </div>
    </main>
    {/* Footer */}
    <footer className="map-footer">
      <div className="footer-row">
        <p>
          <strong>Source:</strong> UN Trade and Development (UNCTAD) and BACI (CEPII), based on UN Comtrade. Data cover HS&nbsp;6309 (worn clothing and other worn articles).{' '}
          <button type="button" className="footer-link-btn js-open-methodology">
            Methodology &amp; data sources
          </button>{' '}
          &middot;{' '}
          <a href="https://unctad.org/page/map-disclaimer" target="_blank" rel="noopener">
            Map disclaimer
          </a>
        </p>
        <div className="footer-logos">
          <img alt="SMEP · UN Trade and Development · UK International Development" src={`${ASSET_BASE}assets/img/smep-logo.png`} />
        </div>
      </div>
    </footer>
    {/* Methodology modal */}
    <div className="hidden methodology-modal">
      <div className="modal-backdrop methodology-modal-backdrop" />
      <div className="modal-card methodology-card" role="dialog" aria-modal="true" aria-label="Methodology and data sources">
        <div className="modal-header">
          <div>
            <div className="modal-title">Methodology and data sources</div>
            <div className="modal-subtitle">Global Second-Hand Clothes Trade Monitor &mdash; technical notes</div>
          </div>
          <button className="btn-close methodology-modal-close" type="button" aria-label="Close">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-body method-body">
          <section className="method-section">
            <h3 className="method-section-title">Data source</h3>
            <dl className="method-dl">
              <dt>Database</dt>
              <dd>BACI international trade database (CEPII), which reconciles the exports and imports reported to UN Comtrade into one harmonized value and quantity per bilateral flow, at the HS 6-digit level. The monitor uses an HS&nbsp;6309 extract of BACI for 2015&ndash;2024, with adjustments for outliers.</dd>
              <dt>Product coverage</dt>
              <dd>
                HS&nbsp;6309 &mdash; <em>Worn clothing and other worn articles</em>: worn clothing, clothing accessories, blankets, household linen, furnishing articles, footwear and headgear showing signs of appreciable wear, presented in bulk, bales, sacks or similar packings. Rags (HS&nbsp;6310) are not included.
              </dd>
              <dt>Years available</dt>
              <dd>2015&ndash;2024. The latest year is based on fewer country reports and may be revised in later BACI releases.</dd>
              <dt>Value unit</dt>
              <dd>Current US dollars (FOB), displayed as $K / $M / $B.</dd>
              <dt>Weight unit</dt>
              <dd>Kilograms (BACI harmonized export weight), displayed in metric tonnes (t&thinsp;/&thinsp;kt&thinsp;/&thinsp;Mt).</dd>
              <dt>Measure (value or weight)</dt>
              <dd>
                The <strong>Measure</strong> switch (Value / Weight) in the filter bar changes every figure on the map, legend, key figures, country panels and the Animate view to the selected measure. Net flows, minimum flow sizes and rankings are computed separately for each measure, so the direction of a net flow
                can differ between value and weight.
              </dd>
              <dt>Not shown</dt>
              <dd>Trade recorded under &ldquo;Other Asia, nes&rdquo; and with special or unspecified partner areas (bunkers, free zones, special categories and other &ldquo;nes&rdquo; areas) is not shown.</dd>
            </dl>
          </section>
          <section className="method-section">
            <h3 className="method-section-title">Flow direction classification</h3>
            <p className="method-note">
              Economies are classified as <strong>North</strong> (developed) or <strong>South</strong> (developing, including least developed) using the UNCTAD development status classification, consistent with UNCTAD flagship publications. The designations &ldquo;developed&rdquo; and &ldquo;developing&rdquo; are
              intended for statistical convenience and do not necessarily express a judgement about the stage reached by a particular country or area in the development process.
            </p>
            <dl className="method-dl">
              <dt>
                <span className="method-flow-dot" style={{ background: '#009EDB' }} /> N&rarr;S
              </dt>
              <dd>Net flow from a developed economy to a developing economy</dd>
              <dt>
                <span className="method-flow-dot" style={{ background: '#72BF44' }} /> S&rarr;N
              </dt>
              <dd>Net flow from a developing economy to a developed economy</dd>
              <dt>
                <span className="method-flow-dot" style={{ background: '#FBAF17' }} /> S&rarr;S
              </dt>
              <dd>Both economies are developing (including least developed)</dd>
              <dt>
                <span className="method-flow-dot" style={{ background: '#A066AA' }} /> N&rarr;N
              </dt>
              <dd>Both economies are developed</dd>
            </dl>
          </section>
          <section className="method-section">
            <h3 className="method-section-title">Trade flow calculation</h3>
            <dl className="method-dl">
              <dt>Net bilateral flow</dt>
              <dd>
                For each pair of economies (A, B), the net flow is A&rsquo;s exports to B minus B&rsquo;s exports to A. The line runs from the net exporter to the net importer, and its size reflects the absolute net amount. Trade in both directions therefore partly offsets; the gross flows in each direction are shown
                in the corridor history and in the CSV downloads.
              </dd>
              <dt>Line width</dt>
              <dd>Square-root scale of the net flow, so that large flows do not hide small ones. Flows above the 98th percentile of those shown are drawn at the maximum width. Larger flows are also drawn more opaque.</dd>
              <dt>Line curvature</dt>
              <dd>All lines bend the same way (clockwise from exporter to importer), so eastward flows bow northward and westward flows bow southward. This shows which end is the exporter without arrows.</dd>
              <dt>Circles</dt>
              <dd>
                Colour shows the economy&rsquo;s net balance (exports minus imports) over all flows in the current region or selection, before the minimum flow size, the Lines limit and the flow-direction filters: blue for net exporters, red for net importers, paler near balance. In a region view this is the balance
                within the region, so it can differ from the country panel, which uses all partners. Size shows the total of the lines drawn for that economy.
              </dd>
            </dl>
          </section>
          <section className="method-section">
            <h3 className="method-section-title">What the map shows</h3>
            <p className="method-note">
              To avoid visual overload, the map draws only the largest net flows. The <strong>On map</strong> figure in the key-figures bar gives the total of the lines drawn and its share of all net flows in the current region or selection. The minimum flow size and the number of lines are set under{' '}
              <strong>Lines</strong> in the filter bar.
            </p>
            <dl className="method-dl">
              <dt>Auto (default)</dt>
              <dd>
                At most <strong>40</strong> lines, and none below a minimum: $10&thinsp;M in the world view, $1&thinsp;M for a region; with countries picked in From / To (counted together), $10&thinsp;K (1&ndash;3), $100&thinsp;K (4&ndash;10), $500&thinsp;K (11&ndash;30) or $1&thinsp;M (31 or more). If more than 40
                flows clear the minimum, the 40 largest are drawn; if fewer do, fewer lines are drawn (a region may show only a few). The flow-direction filters apply afterwards, so hiding a direction also leaves fewer lines. In weight mode the same steps apply in tonnes (10&thinsp;kt, 1&thinsp;kt, 10&thinsp;t,
                100&thinsp;t, 500&thinsp;t, 1&thinsp;kt).
              </dd>
              <dt>Fixed minimum</dt>
              <dd>$10&thinsp;M to $10&thinsp;K (10&thinsp;kt to 10&thinsp;t in weight mode): every net flow at or above the chosen value is drawn.</dd>
              <dt>Maximum number of lines</dt>
              <dd>
                <strong>Auto</strong> (default) sets no separate maximum: the minimum flow size decides, so an Auto minimum draws at most 40 lines and a fixed minimum draws every net flow at or above it. A number N draws only the N largest net flows. With an Auto minimum, it replaces both the automatic minimum and the
                40-line cap, so the N largest flows are drawn however small they are; with a fixed minimum both conditions apply. The N largest are taken before the flow-direction filters, so hiding a direction can leave fewer than N lines.
              </dd>
              <dt>Regions</dt>
              <dd>A region shows only flows between economies of that region (UN M49 regions).</dd>
              <dt>Connect</dt>
              <dd>Only the connections you draw are shown, whatever their size. The region, From / To, minimum flow size and Lines settings do not apply to them; the flow-direction filters still do.</dd>
              <dt>Country panel</dt>
              <dd>
                Gross trade is the economy&rsquo;s exports plus imports with all partners; net balance is exports minus imports. Trading partners, partner concentration, partners by compass direction and flow composition use all of the economy&rsquo;s net flows; &ldquo;Exports and imports by partner&rdquo; shows the
                gross flows in each direction with its main partners. None of them use the minimum flow size, the Lines limit or the flow-direction filters. When a region is selected they are limited to partners in that region.
              </dd>
            </dl>
          </section>
          <section className="method-section">
            <h3 className="method-section-title">Partner concentration (HHI)</h3>
            <p className="method-note">Shown in the country panel. Measures how much an economy&rsquo;s trade is spread across partners or concentrated on a few &mdash; does it trade with everyone, or depend heavily on one partner?</p>
            <dl className="method-dl">
              <dt>Index used</dt>
              <dd>Herfindahl&ndash;Hirschman Index (HHI): the sum of squared partner shares, scaled to 0&ndash;10,000. A score of 10,000 means all trade is with a single partner; a score near 0 means trade is spread evenly across many partners.</dd>
              <dt>Formula</dt>
              <dd>
                <code>
                  HHI = &sum;(share
                  <sub>i</sub>
                  &sup2;) &times; 10,000
                </code>
                , where share
                <sub>i</sub> is partner i&rsquo;s share of the economy&rsquo;s net bilateral flows. Export and import partners are counted together, in the selected measure (value or weight).
              </dd>
              <dt>Interpretation</dt>
              <dd>
                <span className="method-hhi-band" style={{ background: '#d9eaf6' }} />
                Diversified (below 2,000): trade spread across many partners
                <br />
                <span className="method-hhi-band" style={{ background: '#a9d0ec' }} />
                Moderate (2,000 to below 4,000): some partners dominate but diversification remains
                <br />
                <span className="method-hhi-band" style={{ background: '#6fb2df' }} />
                Highly concentrated (4,000 and above): trade heavily dependent on one or two partners
              </dd>
              <dt>Threshold note</dt>
              <dd>These bands are specific to this tool and indicative. They are more lenient than the thresholds used in competition law (for example, the 2023 United States Merger Guidelines treat markets above 1,800 as highly concentrated).</dd>
              <dt>Data scope</dt>
              <dd>All of the economy&rsquo;s net bilateral flows for the selected year, regardless of the minimum flow size, the Lines limit and the flow-direction filters; limited to partners in the region when a region is selected.</dd>
            </dl>
          </section>
          <section className="method-section">
            <h3 className="method-section-title">Sea route visualization</h3>
            <dl className="method-dl">
              <dt>Coverage</dt>
              <dd>Sea routes can be switched on in the country panel (&ldquo;Sea routes&rdquo;, experimental). They are drawn only for flows between different UNCTAD regions (Africa, Americas, Asia, Europe, Oceania); flows within a region keep their curved line to avoid clutter from short routes.</dd>
              <dt>Algorithm</dt>
              <dd>
                Routes are computed with the Eurostat <em>searoute</em> algorithm over a navigable sea graph.
              </dd>
              <dt>Port selection</dt>
              <dd>
                Each economy is routed through one representative port, chosen mainly as its highest-ranked port in the UNCTAD Port Liner Shipping Connectivity Index (PLSCI), with some ports set manually. Landlocked economies are routed through a usual transit port in another country, usually a neighbour (for example,
                Uganda through Mombasa, Kenya). The United States and Canada have two ports: a Pacific-coast port (Los Angeles, Vancouver) when the partner lies east of 60&deg;E, and an Atlantic-coast port (New York, Halifax) otherwise. Australia uses Sydney for partners east of 60&deg;E and in the Americas, and
                Fremantle on the Indian Ocean for partners in Europe, Africa and western Asia.
              </dd>
              <dt>Disclaimer</dt>
              <dd>Routes are indicative only. They do not represent actual tracked HS&nbsp;6309 cargo paths, may not reflect the mode of transport used, and should not be used for navigation.</dd>
            </dl>
          </section>
          <section className="method-section">
            <h3 className="method-section-title">Map disclaimer</h3>
            <p className="method-note">
              The boundaries and names shown and the designations used on this map do not imply official endorsement or acceptance by the United Nations. Dashed lines represent undefined borders. Dotted line represents approximately the Line of Control in Jammu and Kashmir agreed upon by India and Pakistan. The final
              boundary between the Sudan and South Sudan has not yet been determined. A dispute exists between the Governments of Argentina and the United Kingdom of Great Britain and Northern Ireland concerning sovereignty over the Falkland Islands (Malvinas). The final status of the following territories has not yet
              been agreed or determined: Abyei area, Aksai Chin, Arunachal Pradesh, Bi&rsquo;r Tawil, Hala&rsquo;ib Triangle, Ilemi Triangle, Jammu and Kashmir, Kuril Islands, Paracel Islands, Scarborough Shoal, Senkaku Islands and Spratly Islands.
            </p>
            <p className="method-note">
              Full text:{' '}
              <a href="https://unctad.org/page/map-disclaimer" target="_blank" rel="noopener">
                UN Trade and Development map disclaimer
              </a>
              .
            </p>
          </section>
          <section className="method-section method-section-last">
            {/* Updated citation (the earlier one gave 2025) */}
            <h3 className="method-section-title">How to cite</h3>
            <p className="method-cite">
              UN Trade and Development (UNCTAD) (2026). <em>Global Second-Hand Clothes Trade Monitor.</em> Geneva.
            </p>
          </section>
        </div>
      </div>
    </div>
    {/* Mobile filter sheet */}
    <div role="dialog" aria-label="Filters" className="mobile-filter-panel">
      <div className="sheet-handle" />
      <div className="sheet-header">
        <span className="sheet-title">Filters</span>{' '}
        <button className="btn-close mobile-filter-close" type="button" aria-label="Close">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="sheet-body">
        <div className="sheet-section">
          <div className="sheet-row">
            <div>
              <label className="section-label" htmlFor="shc-m-year-select">
                Year
              </label>
              <select id="shc-m-year-select" className="sheet-select m-year-select">
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="2020">2020</option>
                <option value="2019">2019</option>
                <option value="2018">2018</option>
                <option value="2017">2017</option>
                <option value="2016">2016</option>
                <option value="2015">2015</option>
              </select>
            </div>
            <div>
              <div className="section-label">Measure</div>
              <div className="btn-row seg-fill">
                <button className="metric-btn btn-toggle-lg active" data-metric="value" type="button">
                  Value
                </button>{' '}
                <button className="metric-btn btn-toggle-lg" data-metric="weight" type="button">
                  Weight
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="sheet-section explore-only">
          <div className="section-label">Region</div>
          <div className="btn-row">
            <button className="region-btn btn-toggle-lg active" data-region="Global" type="button">
              World
            </button>{' '}
            <button className="region-btn btn-toggle-lg" data-region="Africa" type="button">
              Africa
            </button>{' '}
            <button className="region-btn btn-toggle-lg" data-region="Americas" type="button">
              Americas
            </button>{' '}
            <button className="region-btn btn-toggle-lg" data-region="Asia" type="button">
              Asia
            </button>{' '}
            <button className="region-btn btn-toggle-lg" data-region="Europe" type="button">
              Europe
            </button>{' '}
            <button className="region-btn btn-toggle-lg" data-region="Oceania" type="button">
              Oceania
            </button>
          </div>
        </div>
        <div className="sheet-section explore-only">
          <div className="section-label">Exporters (from)</div>
          <button className="picker-btn-full m-exp-btn" type="button">
            <span className="picker-value m-exp-label">All Exporters</span>{' '}
            <span className="picker-trailing-lg">
              <span className="picker-badge hidden m-exp-count" />{' '}
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
        </div>
        <div className="sheet-section explore-only">
          <div className="section-label">Importers (to)</div>
          <button className="picker-btn-full m-imp-btn" type="button">
            <span className="picker-value m-imp-label">All Importers</span>{' '}
            <span className="picker-trailing-lg">
              <span className="picker-badge importer hidden m-imp-count" />{' '}
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
        </div>
        <div className="sheet-section">
          <div className="section-label">Flow direction</div>
          <div className="flow-chips">
            <label className="flow-chip flow-ns">
              <input type="checkbox" className="flow-checkbox" value="north-south" defaultChecked />{' '}
              <span className="chip-body">
                <span className="chip-swatch" />
                North &rarr; South
              </span>
            </label>{' '}
            <label className="flow-chip flow-sn">
              <input type="checkbox" className="flow-checkbox" value="south-north" defaultChecked />{' '}
              <span className="chip-body">
                <span className="chip-swatch" />
                South &rarr; North
              </span>
            </label>{' '}
            <label className="flow-chip flow-ss">
              <input type="checkbox" className="flow-checkbox" value="south-south" defaultChecked />{' '}
              <span className="chip-body">
                <span className="chip-swatch" />
                South &rarr; South
              </span>
            </label>{' '}
            <label className="flow-chip flow-nn">
              <input type="checkbox" className="flow-checkbox" value="north-north" defaultChecked />{' '}
              <span className="chip-body">
                <span className="chip-swatch" />
                North &rarr; North
              </span>
            </label>
          </div>
          <p className="section-hint">North = developed economies, South = developing economies (UNCTAD classification).</p>
        </div>
        <details className="sheet-advanced explore-only">
          <summary>
            Lines on the map <span className="sheet-adv-sub m-display-summary">Auto</span>
          </summary>
          <div className="sheet-section">
            <div className="section-label">Minimum flow size</div>
            <div className="btn-row">
              <button className="threshold-btn btn-toggle-lg active" data-threshold="auto" type="button">
                Auto
              </button>{' '}
              <button className="threshold-btn btn-toggle-lg" data-threshold="10000000" type="button">
                $10M
              </button>{' '}
              <button className="threshold-btn btn-toggle-lg" data-threshold="1000000" type="button">
                $1M
              </button>{' '}
              <button className="threshold-btn btn-toggle-lg" data-threshold="500000" type="button">
                $500K
              </button>{' '}
              <button className="threshold-btn btn-toggle-lg" data-threshold="100000" type="button">
                $100K
              </button>{' '}
              <button className="threshold-btn btn-toggle-lg" data-threshold="10000" type="button">
                $10K
              </button>
            </div>
            <p className="section-hint">Auto draws at most 40 lines, and none below a minimum that depends on the view.</p>
          </div>
          <div className="sheet-section">
            <div className="section-label">Maximum number of lines</div>
            <div className="btn-row">
              <button className="topn-btn btn-toggle-lg active" data-topn="all" type="button" title="No separate maximum: the minimum flow size decides how many lines are drawn">
                Auto
              </button>{' '}
              <button className="topn-btn btn-toggle-lg" data-topn="50" type="button">
                50
              </button>{' '}
              <button className="topn-btn btn-toggle-lg" data-topn="100" type="button">
                100
              </button>{' '}
              <button className="topn-btn btn-toggle-lg" data-topn="200" type="button">
                200
              </button>{' '}
              <button className="topn-btn btn-toggle-lg" data-topn="500" type="button">
                500
              </button>
            </div>
            <p className="section-hint">Auto lets the minimum flow size decide (at most 40 lines with an Auto minimum). A number draws only the N largest flows.</p>
          </div>
        </details>
        <div className="sheet-section connect-only">
          <p className="section-hint">
            Connect shows only the connections you draw, so region, countries and line limits do not apply (flow directions still do). Tap <b>Explore</b> to return to the full map.
          </p>
        </div>
        <div className="sheet-section">
          <div className="section-label">Download CSV (current view)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="picker-btn-full" data-export="flows" type="button">
              Trade flows — value, weight &amp; unit value
            </button>{' '}
            <button className="picker-btn-full" data-export="summary" type="button">
              Country summary — ranked
            </button>
          </div>
        </div>
      </div>
      <div className="sheet-footer">
        <button className="sheet-reset m-filters-reset" type="button" disabled>
          Reset
        </button>{' '}
        <button className="sheet-done mobile-filter-done" type="button">
          Show map
        </button>
      </div>
    </div>
    {/* Mobile bottom bar */}
    <nav aria-label="View mode" className="mobile-nav">
      <button className="mnav-btn js-mode active" data-mode="explore" type="button" aria-pressed="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z" />
        </svg>{' '}
        <span>Explore</span>
      </button>{' '}
      <button className="mnav-btn js-mode m-connect-btn" data-mode="connect" type="button" aria-pressed="false">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="5" cy="6" r="2.4" />
          <circle cx="19" cy="18" r="2.4" />
          <path d="M6.7 7.6 17.3 16.4" />
        </svg>{' '}
        <span>Connect</span>
      </button>{' '}
      <button className="mnav-btn js-mode m-anim-btn" data-mode="animate" type="button" aria-pressed="false">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M10 8.5v7l6-3.5z" fill="currentColor" stroke="none" />
        </svg>{' '}
        <span>Animate</span>
      </button>{' '}
      <button className="mnav-btn mobile-filter-btn" type="button" aria-haspopup="dialog">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" />
          <circle cx="15" cy="6" r="2" />
          <circle cx="9" cy="12" r="2" />
          <circle cx="17" cy="18" r="2" />
        </svg>{' '}
        <span>Filters</span> <span className="filter-badge mobile-filter-badge" />
      </button>
    </nav>
  </>
);

export default Tracker;
