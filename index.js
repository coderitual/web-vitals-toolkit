const fs = require('fs');
const lighthouse = require('lighthouse');
const puppeteer = require('puppeteer');
const argv = require('yargs').argv;

const chromeLauncher = require('chrome-launcher');
const reportGenerator = require('lighthouse/report/report-generator');
const request = require('request');
const util = require('util');

const options = {
  logLevel: 'info',
  output: 'json',
  disableDeviceEmulation: true,
  chromeFlags: ['--disable-mobile-emulation'],
};

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

  // Disable js
  // browser.on('targetchanged', async (target) => {
  //   const page = await target.page();
  //   if (page && page.url() === url) {
  //     await page.setRequestInterception(true);
  //     page.on('request', (request) => {
  //       if (request.resourceType() === 'script') {
  //         request.abort();
  //       } else {
  //         request.continue();
  //       }
  //     });
  //   }
  // });

  // block third party scripts
  // browser.on('targetchanged', async (target) => {
  //   const page = await target.page();
  //   if (page && page.url() === url) {
  //     await page.setRequestInterception(true);
  //     page.on('request', (request) => {
  //       try {
  //         const url = request.url();
  //         const type = request.resourceType();
  //         if (!url.startsWith('https://brainly.com') && type === 'script') {
  //           console.log(`⛔️ Resource blocked: type: ${type}, url: ${url}`);
  //           request.abort();
  //         } else {
  //           console.log(`✅ Resource passed: type: ${type}, url: ${url}`);
  //           request.continue();
  //         }
  //       } catch (e) {}
  //     });
  //   }
  // });

  // Run Lighthouse
  const { lhr } = await lighthouse(url, options, config);
  await browser.disconnect();
  await chrome.kill();

  const json = reportGenerator.generateReport(lhr, 'json');

  const audits = JSON.parse(json).audits; // Lighthouse audits

  const first_contentful_paint = audits['first-contentful-paint'].displayValue;
  const largest_contentful_paint =
    audits['largest-contentful-paint'].displayValue;
  const speed_index = audits['speed-index'].displayValue;
  const max_potential_fid = audits['max-potential-fid'].displayValue;
  const cumulative_layout_shift =
    audits['cumulative-layout-shift'].displayValue;
  const total_blocking_time = audits['total-blocking-time'].displayValue;
  const time_to_interactive = audits['interactive'].displayValue;

  console.log(`\n
     Lighthouse metrics: 
     🎨 First Contentful Paint: ${first_contentful_paint}, 
     📱 Cumulative Layout Shift: ${cumulative_layout_shift},
     🌄 Largest Contentful Paint: ${largest_contentful_paint},
     ⏳ Max Potential FID: ${max_potential_fid},
     ⌛️ Total Blocking Time: ${total_blocking_time},
     👆 Time To Interactive: ${time_to_interactive}`);
}

lighthouseFromPuppeteer('https://brainly.com/question/1713545', options);
