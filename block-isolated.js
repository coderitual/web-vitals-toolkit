const argv = require('yargs').argv;
const convertUrlToFilename = require('./lib/convertUrlToFilename');
const lighthouseFromPuppeteer = require('./lib/lighthouseFromPuppeteer');
const saveToCsv = require('./lib/saveToCsv');

// CLI arguments
const url = argv.url ?? 'https://brainly.com/question/1713545';
const filename =
  argv.filename ??
  `results/isolated_${convertUrlToFilename(url)}-${Date.now()}.csv`;

const blockedUrlPatterns = [
  '*datadome*',
  '*doubleclick*',
  '*hotjar*',
  '*datadome*',
  '*survicate*',
  '*facebook*',
  '*quantcount*',
  '*branch.io*',
  '*connatix*',
  '*aaxads*',
  '*sentry*',
  '*aaxdetect*',
  '*app.link*',
  '*google*',
];

const options = {
  output: 'html',
  onlyCategories: ['performance'],
  disableDeviceEmulation: true,
  chromeFlags: ['--disable-mobile-emulation'],
};

// Default mobile config
const config = {
  extends: 'lighthouse:default',
  settings: {
    maxWaitForFcp: 15 * 1000,
    maxWaitForLoad: 35 * 1000,
    // lighthouse:default is mobile by default
    // Skip the h2 audit so it doesn't lie to us. See https://github.com/GoogleChrome/lighthouse/issues/6539
    skipAudits: ['uses-http2'],
  },
  audits: ['metrics/first-contentful-paint-3g'],
  categories: {
    // TODO(bckenny): type extended Config where e.g. category.title isn't required
    performance: /** @type {LH.Config.CategoryJson} */ ({
      auditRefs: [{ id: 'first-contentful-paint-3g', weight: 0 }],
    }),
  },
};

async function gatherResults(url, options, config) {
  const results = [];
  const patterns = ['', ...blockedUrlPatterns];
  for (const pattern of patterns) {
    for (let i = 0; i < 1; i++) {
      const opts = { ...options, blockedUrlPatterns: [pattern] };
      const result = await lighthouseFromPuppeteer(url, opts, config);
      results.push({
        url,
        pattern,
        ...result,
      });
    }
  }
  return results;
}

async function main() {
  const results = await gatherResults(url, options, config);
  saveToCsv(filename, url, results);
  process.exit(0);
}

main();
