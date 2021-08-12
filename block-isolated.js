const lighthouse = require('lighthouse');
const puppeteer = require('puppeteer');
const argv = require('yargs').argv;
const chromeLauncher = require('chrome-launcher');
const reportGenerator = require('lighthouse/report/report-generator');
const request = require('request');
const util = require('util');
const fs = require('fs');
const path = require('path');
const convertUrlToFilename = require('./convertUrlToFilename');

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

// function creates directoy if it doesn't exist
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }
}

async function lighthouseFromPuppeteer(url, options, config = null) {
  // Launch chrome using chrome-launcher
  const chrome = await chromeLauncher.launch(options);
  options.port = chrome.port;

  // Connect chrome-launcher to puppeteer
  const resp = await util.promisify(request)(
    `http://localhost:${options.port}/json/version`,
  );
  const { webSocketDebuggerUrl } = JSON.parse(resp.body);
  const browser = await puppeteer.connect({
    browserWSEndpoint: webSocketDebuggerUrl,
  });

  // Run Lighthouse
  const { lhr, report } = await lighthouse(url, options, config);

  const json = reportGenerator.generateReport(lhr, 'json');

  const audits = JSON.parse(json).audits; // Lighthouse audits

  const first_contentful_paint =
    audits['first-contentful-paint'].numericValue.toFixed(2);
  const largest_contentful_paint =
    audits['largest-contentful-paint'].numericValue.toFixed(2);
  const speed_index = audits['speed-index'].numericValue.toFixed(2);
  const max_potential_fid = audits['max-potential-fid'].numericValue.toFixed(2);
  const cumulative_layout_shift =
    audits['cumulative-layout-shift'].numericValue.toFixed(4);
  const total_blocking_time =
    audits['total-blocking-time'].numericValue.toFixed(2);
  const time_to_interactive = audits['interactive'].numericValue.toFixed(2);

  console.log(`\n
     Lighthouse metrics: 
     URL: ${url},
     🎨 First Contentful Paint: ${first_contentful_paint}, 
     📱 Cumulative Layout Shift: ${cumulative_layout_shift},
     🌄 Largest Contentful Paint: ${largest_contentful_paint},
     ⏳ Max Potential FID: ${max_potential_fid},
     ⌛️ Total Blocking Time: ${total_blocking_time},
     👆 Time To Interactive: ${time_to_interactive}`);

  return {
    first_contentful_paint,
    cumulative_layout_shift,
    largest_contentful_paint,
    max_potential_fid,
    total_blocking_time,
    time_to_interactive,
  };

  await browser.disconnect();
  await chrome.kill();
}

async function gatherResults(url, options, config) {
  const results = [];
  //const patterns = ['', ...blockedUrlPatterns];
  const patterns = [''];
  for (const pattern of patterns) {
    for (let i = 0; i < 1; i++) {
      const result = await lighthouseFromPuppeteer(url, options, config);
      results.push({
        url,
        pattern,
        ...result,
      });
    }
  }
  return results;
}

function saveToCSV(filename, url, results) {
  ensureDir(path.dirname(filename));
  fs.appendFileSync(
    filename,
    `url, blocked_pattern, first_contentful_paint, cumulative_layout_shift, largest_contentful_paint, max_potential_fid, total_blocking_time, time_to_interactive\n`,
    function (err) {
      if (err) throw err;
    },
  );

  for (const result of results) {
    const {
      url,
      pattern,
      first_contentful_paint,
      cumulative_layout_shift,
      largest_contentful_paint,
      max_potential_fid,
      total_blocking_time,
      time_to_interactive,
    } = result;

    fs.appendFileSync(
      filename,
      `${url}, ${
        pattern || '<no-pattern>'
      }, ${first_contentful_paint}, ${cumulative_layout_shift}, ${largest_contentful_paint}, ${max_potential_fid}, ${total_blocking_time}, ${time_to_interactive}\n`,
      function (err) {
        if (err) throw err;
      },
    );
  }
}

async function main() {
  const results = await gatherResults(url, options, config);
  saveToCSV(filename, url, results);
  process.exit(0);
}

main();
