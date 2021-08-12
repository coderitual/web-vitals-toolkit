const argv = require('yargs').argv;
const convertUrlToFilename = require('./lib/convertUrlToFilename');
const lighthouseFromPuppeteer = require('./lib/lighthouseFromPuppeteer');
const saveToCsv = require('./lib/saveToCsv');
const getBlockedUrlPatterns = require('./getBlockedUrlPatterns');
const getConfig = require('./getConfig');
const getOptions = require('./getOptions');

// CLI arguments
const url = argv.url ?? 'https://brainly.com/question/1713545';
const filename =
  argv.filename ??
  `results/isolated_${convertUrlToFilename(url)}-${Date.now()}.csv`;
const numberOfRuns = argv.numberOfRuns ?? 5;

const blockedUrlPatterns = getBlockedUrlPatterns();
const config = getConfig();
const options = getOptions();

async function gatherResults(url, options, config, blockedUrlPatterns) {
  const results = [];
  const patterns = ['', ...blockedUrlPatterns];
  for (const pattern of patterns) {
    for (let i = 0; i < numberOfRuns; i++) {
      const opts = {
        ...options,
        blockedUrlPatterns: [pattern].filter(Boolean),
      };
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
  const results = await gatherResults(url, options, config, blockedUrlPatterns);
  saveToCsv(filename, url, results);
  process.exit(0);
}

main();
