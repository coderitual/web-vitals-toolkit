const lighthouse = require('lighthouse');
const puppeteer = require('puppeteer');
const chromeLauncher = require('chrome-launcher');
const request = require('request');
const util = require('util');

async function gatherScriptsFromUrl(url, options, config = null) {
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

  const scripts = [];
  browser.on('targetchanged', async (target) => {
    const page = await target.page();
    if (page && page.url() === url) {
      page.on('request', (request) => {
        try {
          const url = request.url();
          const type = request.resourceType();
          if (type === 'script') {
            scripts.push(url);
          }
        } catch (e) {}
      });
    }
  });

  // Run Lighthouse
  const { lhr, report } = await lighthouse(url, options, config);

  await browser.disconnect();
  await chrome.kill();

  return scripts;
}

module.exports = gatherScriptsFromUrl;
