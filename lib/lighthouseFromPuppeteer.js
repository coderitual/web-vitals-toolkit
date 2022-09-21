const lighthouse = require('lighthouse');
const puppeteer = require('puppeteer');
const argv = require('yargs').argv;
const chromeLauncher = require('chrome-launcher');
const reportGenerator = require('lighthouse/report/generator/report-generator');
const request = require('request');
const util = require('util');
const { startFlow } = require('lighthouse/lighthouse-core/fraggle-rock/api.js');

async function activePage(context) {
  const allPages = await context.pages();
  for (let page of allPages) {
    const state = await page.evaluate(() => document.visibilityState);
    if (state === 'visible') {
      return page;
    }
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

  // bootstraping flow before measurement
  console.log({ options, config });
  let page = await browser.newPage();
  let session = await page.target().createCDPSession();
  // We can use authenticate method or just directly set a header
  // await page.authenticate({
  //   username: 'staging',
  //   password: 'IdQUaMsyRMBO',
  // });
  await page.setViewport(config.settings.screenEmulation);
  await page.setExtraHTTPHeaders(options.extraHeaders);
  await page.goto(url);

  await page.waitForFunction(() =>
    document.querySelector('.didomi-popup-container'),
  );
  page.click('#didomi-notice-agree-button');
  await page.waitForFunction(
    () => !document.querySelector('.didomi-popup-container'),
  );

  // Run Lighthouse
  // const lh = lighthouse(url, options, config);
  // await new Promise((resolve) => setTimeout(resolve, 7000));
  // page = await activePage(browser);
  // await page.setViewport(config.settings.screenEmulation);
  // await page.setExtraHTTPHeaders(options.extraHeaders);
  // session = await page.target().createCDPSession();
  // await session.send('Input.synthesizeScrollGesture', {
  //   x: 100,
  //   y: 0,
  //   yDistance: -500,
  //   speed: 1000,
  //   repeatCount: 2,
  //   repeatDelayMs: 250,
  // });
  // const { lhr, report } = await lh;

  // Run lh user flow
  const flow = await startFlow(page, {
    name: 'user flow',
    config,
  });

  const navigateFlow = flow.navigate(url, {
    stepName: 'Page load after bootstrap',
  });

  await new Promise((resolve) => setTimeout(resolve, 5000));

  await session.send('Input.synthesizeScrollGesture', {
    x: 100,
    y: 0,
    yDistance: -1500,
    speed: 1000,
    repeatCount: 2,
    repeatDelayMs: 250,
  });

  await navigateFlow;
  const flowResult = await flow.createFlowResult();
  const lhr = flowResult.steps[0].lhr;

  const json = reportGenerator.generateReport(lhr, 'json');
  const audits = JSON.parse(json).audits; // Lighthouse audits

  const first_contentful_paint =
    audits['first-contentful-paint'].numericValue?.toFixed(2);
  const largest_contentful_paint =
    audits['largest-contentful-paint'].numericValue?.toFixed(2);
  const speed_index = audits['speed-index'].numericValue?.toFixed(2);
  const max_potential_fid =
    audits['max-potential-fid'].numericValue?.toFixed(2);
  const cumulative_layout_shift =
    audits['cumulative-layout-shift'].numericValue?.toFixed(4);
  const total_blocking_time =
    audits['total-blocking-time'].numericValue?.toFixed(2);
  const time_to_interactive = audits['interactive'].numericValue?.toFixed(2);

  console.log(`\n
     Lighthouse metrics: 
     URL: ${url},
     🎨 First Contentful Paint: ${first_contentful_paint}, 
     📱 Cumulative Layout Shift: ${cumulative_layout_shift},
     🌄 Largest Contentful Paint: ${largest_contentful_paint},
     ⏳ Max Potential FID: ${max_potential_fid},
     ⌛️ Total Blocking Time: ${total_blocking_time},
     👆 Time To Interactive: ${time_to_interactive}`);

  await browser.disconnect();
  await chrome.kill();

  return {
    first_contentful_paint,
    cumulative_layout_shift,
    largest_contentful_paint,
    max_potential_fid,
    total_blocking_time,
    time_to_interactive,
  };
}

module.exports = lighthouseFromPuppeteer;
