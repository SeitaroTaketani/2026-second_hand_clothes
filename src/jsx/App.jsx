import { useEffect, useRef } from 'react';

import Article from '../Article.mdx';

import './../styles/styles.css';

import meta from './../meta.json';

import ArticleApp from './components/Article.jsx';
import { STATE } from './components/custom/config.js';

import MainApp from './components/custom/main.js';

const components = {
  ArticleApp
};

const App = () => {
  const appRef = useRef();

  useEffect(() => {
    window.appRef = appRef;
    MainApp.init();

    const root = appRef.current;
    const onSelectionChange = () => MainApp.updateDashboard(false);
    const onArcClick = e => MainApp.openArcModal(e.detail.exporter, e.detail.importer);
    const onCountryClick = e => MainApp.openInsightPanel(e.detail);
    const onCountryHover = e => MainApp.showTooltip(e.detail.event, e.detail.country);
    const onCountryHoverEnd = () => MainApp.hideTooltip();

    root.addEventListener('shc:selection-change', onSelectionChange);
    root.addEventListener('shc:arc-click', onArcClick);
    root.addEventListener('shc:country-click', onCountryClick);
    root.addEventListener('shc:country-hover', onCountryHover);
    root.addEventListener('shc:country-hoverend', onCountryHoverEnd);

    return () => {
      root.removeEventListener('shc:selection-change', onSelectionChange);
      root.removeEventListener('shc:arc-click', onArcClick);
      root.removeEventListener('shc:country-click', onCountryClick);
      root.removeEventListener('shc:country-hover', onCountryHover);
      root.removeEventListener('shc:country-hoverend', onCountryHoverEnd);
      MainApp.destroy();
    };
  }, []);

  return (
    <div className="app" ref={appRef}>
      <Article components={components} meta={meta} MainApp={MainApp} State={STATE} />
    </div>
  );
};

export default App;
