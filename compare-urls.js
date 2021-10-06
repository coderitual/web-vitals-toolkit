const argv = require('yargs').argv;
const convertUrlToFilename = require('./lib/convertUrlToFilename');
const lighthouseFromPuppeteer = require('./lib/lighthouseFromPuppeteer');
const saveToCsv = require('./lib/saveToCsv');
const gatherScriptsFromUrl = require('./lib/gatherScriptsFromUrl');
const getUrlsToCompare = require('./getUrlsToCompare');
const getConfig = require('./getConfig');
const getOptions = require('./getOptions');

// CLI arguments
const numberOfRuns = argv.numberOfRuns ?? 1;
const urls =
  argv.urls ?? getUrlsToCompare();
const filename =
  argv.filename ??
  `results/compare_urls${urls.length}_n${numberOfRuns}-${Date.now()}.csv`;

const config = getConfig();
const options = getOptions();

async function gatherResults(urls, options, config) {
  const results = [];
  const runs = urls.length * numberOfRuns;
  let run = 0;
  for (const url of urls) {
    for (let i = 0; i < numberOfRuns; i++) {
      run++;
      console.log(`\n🏃‍♂️ Run compare url: ${run} / ${runs}`);
      console.log('url:', url);
      const opts = {
        ...options,
      };
      const result = await lighthouseFromPuppeteer(url, opts, config);
      results.push({
        url,
        ...result,
      });
    }
  }
  return results;
}

async function main() {
  console.log(`🏃‍♂️ Gather results for ${urls}`);
  console.log(`🏃‍♂️ Gather ${numberOfRuns} runs`);
  console.log(`🏃‍♂️ Save results to ${filename}`);

  const results = await gatherResults(urls, options, config);
  saveToCsv(filename, results);
  process.exit(0);
}

main();
