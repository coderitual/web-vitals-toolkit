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
  `results/progressive_${convertUrlToFilename(url)}-${Date.now()}.csv`;

const blockedUrlPatterns = getBlockedUrlPatterns();
const config = getConfig();
const options = getOptions();

async function gatherResults(url, options, config) {
  const results = [];
  const patterns = ['', ...blockedUrlPatterns];
  const blockedPatterns = [];
  for (const pattern of patterns) {
    blockedPatterns.push(pattern);
    console.log(blockedPatterns);
    for (let i = 0; i < 1; i++) {
      const opts = {
        ...options,
        blockedUrlPatterns: blockedPatterns.filter(Boolean),
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
  const results = await gatherResults(url, options, config);
  saveToCsv(filename, url, results);
  process.exit(0);
}

main();
