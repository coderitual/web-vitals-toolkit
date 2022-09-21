const constants = require('lighthouse/lighthouse-core/config/constants');

// Default mobile config
const PIXEL5_EMULATION_METRICS = {
  mobile: true,
  width: 393,
  height: 851,
  deviceScaleFactor: 2.8,
  disabled: false,
};

const mobileConfig = {
  extends: 'lighthouse:default',
  settings: {
    maxWaitForFcp: 15 * 1000,
    maxWaitForLoad: 35 * 1000,
    throttling: constants.throttling.desktopDense4G,
    // lighthouse:default is mobile by default
    // Skip the h2 audit so it doesn't lie to us. See https://github.com/GoogleChrome/lighthouse/issues/6539
    skipAudits: ['uses-http2'],
    // this option might be used to control loading scripts which detecting lh/bots, e.g. cookie consents providers
    emulatedUserAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
    screenEmulation: PIXEL5_EMULATION_METRICS,
  },
  audits: ['metrics/first-contentful-paint-3g'],
  categories: {
    // TODO(bckenny): type extended Config where e.g. category.title isn't required
    performance: /** @type {LH.Config.CategoryJson} */ ({
      auditRefs: [{ id: 'first-contentful-paint-3g', weight: 0 }],
    }),
  },
};

// Default desktop config
const desktopConfig = {
  extends: 'lighthouse:default',
  settings: {
    maxWaitForFcp: 15 * 1000,
    maxWaitForLoad: 35 * 1000,
    formFactor: 'desktop',
    throttling: constants.throttling.desktopDense4G,
    screenEmulation: constants.screenEmulationMetrics.desktop,
    emulatedUserAgent: constants.userAgents.desktop,
    // Skip the h2 audit so it doesn't lie to us. See https://github.com/GoogleChrome/lighthouse/issues/6539
    skipAudits: ['uses-http2'],
  },
};

module.exports = function getCofig(type = 'mobile') {
  switch (type) {
    case 'mobile':
      return mobileConfig;
    default:
      return desktopConfig;
  }
};
